"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { usePaymentHub } from "@/providers/payment-hub-provider";

export function OrderPaymentUpdates({ orderId, invoiceRef }: {
  orderId?: string;
  invoiceRef?: string | null;
}) {
  const { payments } = usePaymentHub();
  const router = useRouter();
  const refreshedEvent = useRef<string | null>(null);
  const event = orderId ? payments.get(orderId) : Array.from(payments.values()).at(-1);

  useEffect(() => {
    if (!event || (invoiceRef && event.data.invoiceRef !== invoiceRef) || refreshedEvent.current === event.eventId) return;
    refreshedEvent.current = event.eventId;
    router.refresh();
  }, [event, invoiceRef, router]);

  return null;
}
