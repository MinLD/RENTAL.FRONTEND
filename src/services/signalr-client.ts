import {
  AbortError,
  DefaultHttpClient,
  HttpError,
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
  NullLogger,
  type HttpRequest,
} from "@microsoft/signalr";

export const SIGNALR_RECONNECT_DELAYS_MS = [0, 2_000, 10_000, 30_000];

export const SIGNALR_DEFAULT_TRANSPORT =
  HttpTransportType.WebSockets | HttpTransportType.LongPolling;

export type SignalRConnectionOptions = {
  onForbidden?: () => void;
  onUnauthorized?: () => void;
  refreshSession?: () => Promise<void>;
  isDisposed?: () => boolean;
  hubTag?: string;
  notFoundFallbackMessage?: string;
  transport?: HttpTransportType;
};

export class SignalRHttpClient extends DefaultHttpClient {
  private readonly options: SignalRConnectionOptions;

  constructor(options: SignalRConnectionOptions) {
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
      if (
        !(error instanceof HttpError) ||
        error.statusCode !== 401 ||
        !this.options.refreshSession ||
        this.options.isDisposed?.()
      ) {
        // Observe the structured HTTP status before SignalR wraps the error.
        this.reportRejection(error);
        throw error;
      }
    }

    try {
      // The BFF sets new HttpOnly cookies; JavaScript never reads the JWT.
      await this.options.refreshSession();
    } catch (error) {
      let status: number | undefined;
      if (error instanceof HttpError) {
        status = error.statusCode;
      } else if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        typeof error.status === "number"
      ) {
        status = error.status;
      }
      if (status === 401) this.options.onUnauthorized?.();
      // A refresh outage must retain its actual error, not masquerade as logout.
      throw error;
    }

    if (this.options.isDisposed?.()) {
      throw new AbortError("SignalR connection disposed during session refresh.");
    }

    try {
      return await super.send(request);
    } catch (error) {
      this.reportRejection(error);
      throw error;
    }
  }
}

export function createSignalRConnection(
  hubUrl: string,
  options: SignalRConnectionOptions = {},
): HubConnection {
  let accessRejected = false;
  const hubTag = options.hubTag ?? "SignalR";
  const httpClient = new SignalRHttpClient({
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
      transport: options.transport ?? SIGNALR_DEFAULT_TRANSPORT,
      skipNegotiation: false,
      withCredentials: true,
      httpClient,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
        accessRejected
          ? null
          : SIGNALR_RECONNECT_DELAYS_MS[previousRetryCount] ?? null,
    })
    .configureLogging({
      log(level, message) {
        // Cleanup intentionally stops the old connection. Its pending start may
        // reject afterward; SignalR logs that rejection before our catch runs.
        if (
          options.isDisposed?.() ||
          level < LogLevel.Warning ||
          level === LogLevel.None
        ) {
          return;
        }

        // SignalR reports transport failures at Error level even when recovery
        // is handled by reconnect/REST polling. Keep diagnostics without making
        // Next.js treat a network interruption as an application crash.
        const isConnectionFailure =
          level === LogLevel.Error &&
          (message.startsWith("Connection disconnected with error ") ||
            message.startsWith("Failed to start the connection: ") ||
            message.startsWith("Failed to start the transport '") ||
            message.startsWith(
              "Failed to complete negotiation with the server: ",
            ));
        const outputLevel = isConnectionFailure ? LogLevel.Warning : level;
        const displayMessage =
          message.includes("</html>") || message.includes("<!DOCTYPE html>")
            ? options.notFoundFallbackMessage ??
              `Status code '404': SignalR ${hubTag} endpoint not found. System operates normally via REST polling.`
            : message;
        const formatted = `[${new Date().toISOString()}] [${hubTag}] ${LogLevel[outputLevel]}: ${displayMessage}`;
        if (level === LogLevel.Warning || isConnectionFailure) {
          console.warn(formatted);
        } else {
          console.error(formatted);
        }
      },
    })
    .build();
}
