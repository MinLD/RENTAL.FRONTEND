import type { HubConnection } from "@microsoft/signalr";
import type { PaymentCompletedEvent } from "../lib/validations/payment-hub.ts";
import {
  createSignalRConnection,
  type SignalRConnectionOptions,
} from "./signalr-transport.ts";

export const PAYMENT_COMPLETED_EVENT = "PaymentCompleted";
const MAX_RECENT_PAYMENTS = 100;
const RECONNECT_DELAYS_MS = [0, 2_000, 10_000, 30_000];

export type PaymentHubConnectionOptions = SignalRConnectionOptions;


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

export function createPaymentHubConnection(
  hubUrl: string,
  options: PaymentHubConnectionOptions = {},
): HubConnection {
  return createSignalRConnection(hubUrl, {
    ...options,
    hubName: "PaymentHub",
    reconnectDelaysMs: RECONNECT_DELAYS_MS,
  });
}
