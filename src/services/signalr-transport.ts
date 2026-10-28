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

export const DEFAULT_RECONNECT_DELAYS_MS = [0, 2_000, 5_000, 10_000, 30_000];

export type SignalRConnectionOptions = {
  hubName?: string;
  onForbidden?: () => void;
  onUnauthorized?: () => void;
  refreshSession?: () => Promise<void>;
  isDisposed?: () => boolean;
  reconnectDelaysMs?: number[];
};

function extractHttpStatus(error: unknown): number | undefined {
  if (error instanceof HttpError) return error.statusCode;
  if (error && typeof error === "object" && "status" in error) {
    const status = error.status;
    if (typeof status === "number") return status;
  }
  return undefined;
}

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
        this.reportRejection(error);
        throw error;
      }
    }

    try {
      // BFF sets new HttpOnly cookies; JavaScript never reads the JWT.
      await this.options.refreshSession();
    } catch (error) {
      const status = extractHttpStatus(error);
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
  const hubName = options.hubName ?? "SignalR";
  const reconnectDelays = options.reconnectDelaysMs ?? DEFAULT_RECONNECT_DELAYS_MS;
  let accessRejected = false;

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
      transport: HttpTransportType.WebSockets,
      skipNegotiation: false,
      withCredentials: true,
      httpClient,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
        accessRejected ? null : reconnectDelays[previousRetryCount] ?? null,
    })
    .configureLogging({
      log(level, message) {
        if (options.isDisposed?.() || level < LogLevel.Warning || level === LogLevel.None) return;

        const isConnectionFailure =
          level === LogLevel.Error &&
          (message.startsWith("Connection disconnected with error ") ||
            message.startsWith("Failed to start the connection: ") ||
            message.startsWith("Failed to start the transport '") ||
            message.startsWith("Failed to complete negotiation with the server: "));

        const outputLevel = isConnectionFailure ? LogLevel.Warning : level;
        const formatted = `[${new Date().toISOString()}] [${hubName}] ${LogLevel[outputLevel]}: ${message}`;
        if (level === LogLevel.Warning || isConnectionFailure) {
          console.warn(formatted);
        } else {
          console.error(formatted);
        }
      },
    })
    .build();
}
