import type { PaymentCompletedEvent } from "@/lib/validations/payment-hub";
import {
  createSignalRConnection,
  type SignalRConnectionOptions,
} from "./signalr-client.ts";

export const PAYMENT_COMPLETED_EVENT = "PaymentCompleted";
const MAX_RECENT_PAYMENTS = 100;

export type PaymentHubConnectionOptions = SignalRConnectionOptions;

export function rememberPaymentCompletion(
  current: ReadonlyMap<string, PaymentCompletedEvent>,
  event: PaymentCompletedEvent,
): ReadonlyMap<string, PaymentCompletedEvent> {
  const previous = current.get(event.data.rentalOrderId);
  if (
    previous &&
    (previous.eventId === event.eventId ||
      (previous.data.invoiceRef === event.data.invoiceRef &&
        previous.data.revision >= event.data.revision))
  )
    return current;
  const payments = new Map(current);
  payments.delete(event.data.rentalOrderId);
  payments.set(event.data.rentalOrderId, event);
  if (payments.size > MAX_RECENT_PAYMENTS)
    payments.delete(payments.keys().next().value!);
  return payments;
}

export function createPaymentHubConnection(
  hubUrl: string,
  options: PaymentHubConnectionOptions = {},
) {
  return createSignalRConnection(hubUrl, {
    ...options,
    hubTag: "PaymentHub",
    notFoundFallbackMessage:
      "Status code '404': SignalR Payment Hub endpoint not found. System operates normally via REST polling.",
  });
}
