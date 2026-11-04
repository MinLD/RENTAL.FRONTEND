import {
  AbortError,
  DefaultHttpClient,
  HttpError,
  HttpTransportType,
  HubConnectionBuilder,
  LogLevel,
  NullLogger,
  type HttpRequest,
} from "@microsoft/signalr";

import type { PaymentCompletedEvent } from "@/lib/validations/payment-hub";

export const PAYMENT_COMPLETED_EVENT = "PaymentCompleted";
const MAX_RECENT_PAYMENTS = 100;
const RECONNECT_DELAYS_MS = [0, 2_000, 10_000, 30_000];

type PaymentHubConnectionOptions = {
  onForbidden?: () => void;
  onUnauthorized?: () => void;
  refreshSession?: () => Promise<void>;
  isDisposed?: () => boolean;
};

class PaymentHubHttpClient extends DefaultHttpClient {
  private readonly options: PaymentHubConnectionOptions;

  constructor(options: PaymentHubConnectionOptions) {
    super(NullLogger.instance);
    this.options = options;
  }

  private reportRejection(error: unknown) {
    if (!(error instanceof HttpError)) return;
    if (error.statusCode === 403) this.options.onForbidden?.();
    if (error.statusCode === 401) this.options.onUnauthorized?.();
  }

  override async send(request: HttpRequest) {
    try {
      return await super.send(request);
    } catch (error) {
      if (!(error instanceof HttpError) || error.statusCode !== 401 || !this.options.refreshSession || this.options.isDisposed?.()) {
        // Observe the structured HTTP status before SignalR wraps the error.
        this.reportRejection(error);
        throw error;
      }
    }

    try {
      // The BFF sets new HttpOnly cookies; JavaScript never reads the JWT.
      await this.options.refreshSession();
    } catch (error) {
      const status = error instanceof HttpError ? error.statusCode
        : error && typeof error === "object" && "status" in error ? error.status : undefined;
      if (status === 401) this.options.onUnauthorized?.();
      // A refresh outage must retain its actual error, not masquerade as logout.
      throw error;
    }
    if (this.options.isDisposed?.()) throw new AbortError("PaymentHub connection disposed during session refresh.");

    try {
      return await super.send(request);
    } catch (error) {
      this.reportRejection(error);
      throw error;
    }
  }
}

export function rememberPaymentCompletion(
  current: ReadonlyMap<string, PaymentCompletedEvent>,
  event: PaymentCompletedEvent,
): ReadonlyMap<string, PaymentCompletedEvent> {
  const previous = current.get(event.data.rentalOrderId);
  if (previous && (previous.eventId === event.eventId || (
    previous.data.invoiceRef === event.data.invoiceRef && previous.data.revision >= event.data.revision
  ))) return current;
  const payments = new Map(current);
  payments.delete(event.data.rentalOrderId);
  payments.set(event.data.rentalOrderId, event);
  if (payments.size > MAX_RECENT_PAYMENTS) payments.delete(payments.keys().next().value!);
  return payments;
}

export function createPaymentHubConnection(hubUrl: string, options: PaymentHubConnectionOptions = {}) {
  let accessRejected = false;
  const httpClient = new PaymentHubHttpClient({
    ...options,
    onForbidden: () => {
      accessRejected = true;
      options.onForbidden?.();
    },
    onUnauthorized: () => {
      accessRejected = true;
      options.onUnauthorized?.();
    },
  });
  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      transport: HttpTransportType.WebSockets,
      skipNegotiation: false,
      withCredentials: true,
      httpClient,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
        accessRejected ? null : RECONNECT_DELAYS_MS[previousRetryCount] ?? null,
    })
    .configureLogging({
      log(level, message) {
        // Cleanup intentionally stops the old connection. Its pending start may
        // reject afterward; SignalR logs that rejection before our catch runs.
        if (options.isDisposed?.() || level < LogLevel.Warning || level === LogLevel.None) return;
        // SignalR reports transport failures at Error level even when recovery
        // is handled by reconnect/REST polling. Keep diagnostics without making
        // Next.js treat a network interruption as an application crash.
        const isConnectionFailure = level === LogLevel.Error && (
          message.startsWith("Connection disconnected with error ") ||
          message.startsWith("Failed to start the connection: ") ||
          message.startsWith("Failed to start the transport '") ||
          message.startsWith("Failed to complete negotiation with the server: ")
        );
        const outputLevel = isConnectionFailure ? LogLevel.Warning : level;
        const displayMessage =
          message.includes("</html>") || message.includes("<!DOCTYPE html>")
            ? "Status code '404': SignalR Payment Hub endpoint not found. System operates normally via REST polling."
            : message;
        const formatted = `[${new Date().toISOString()}] [PaymentHub] ${LogLevel[outputLevel]}: ${displayMessage}`;
        if (level === LogLevel.Warning || isConnectionFailure) console.warn(formatted);
        else console.error(formatted);
      },
    })
    .build();
}
