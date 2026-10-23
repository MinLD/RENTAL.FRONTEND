import { z } from "zod";

export const paymentCompletedSchema = z.object({
  eventId: z.uuid(),
  version: z.literal(1),
  occurredAt: z.iso.datetime({ offset: true }),
  data: z.object({
    invoiceRef: z.string().min(1),
    rentalOrderId: z.uuid(),
    status: z.literal("PAID"),
    totalAmount: z.number().nonnegative(),
    currency: z.string().min(1),
    paidAt: z.iso.datetime({ offset: true }),
    revision: z.number().int().nonnegative(),
  }),
});

export type PaymentCompletedEvent = z.infer<typeof paymentCompletedSchema>;
