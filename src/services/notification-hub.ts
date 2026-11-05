import {
  createSignalRConnection,
  type SignalRConnectionOptions,
} from "./signalr-client.ts";

export const NOTIFICATION_INBOX_CHANGED_EVENT = "NotificationInboxChanged";

export type NotificationHubConnectionOptions = SignalRConnectionOptions;

export function createNotificationHubConnection(
  hubUrl: string,
  options: NotificationHubConnectionOptions = {},
) {
  return createSignalRConnection(hubUrl, {
    ...options,
    hubTag: "NotificationHub",
    notFoundFallbackMessage:
      "Status code '404': SignalR Notification Hub endpoint not found. System operates normally via REST polling.",
  });
}
