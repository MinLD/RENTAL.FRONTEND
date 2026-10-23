import Link from "next/link";
import { redirect } from "next/navigation";

import { ErrorState } from "@/components/error-state";
import { Container } from "@/components/layout/container";
import { OrderPaymentSuccess } from "@/components/orders/order-payment-success";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { OrderPaymentProvider } from "@/providers/order-payment-provider";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import { getCurrentUser } from "@/services/session-service";
import type { Invoice, RenterOrderDetail } from "@/types/checkout";
import { getOrderPaymentProgress, getOrderPaymentSnapshot, normalizeOrderStatus } from "@/utils/order-payment";
import { withReturnTo } from "@/utils/return-to";

export const metadata = { title: "Kết quả thanh toán | DPU Rental" };

function PaymentResultError({ href }: { href: string }) {
  return <Container className="flex-1 py-12">
    <ErrorState
      action={<Button asChild><Link href={href}>Thử lại</Link></Button>}
      description="Vui lòng thử tải lại để xem kết quả thanh toán của đơn thuê."
      title="Chưa kiểm tra được kết quả thanh toán"
    />
  </Container>;
}

export default async function OrderPaymentSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detailHref = `/orders/${encodeURIComponent(id)}`;
  const href = `${detailHref}/success`;
  const user = await getCurrentUser();
  if (!user) redirect(withReturnTo("/login", href));

  const result = await serverApiResult(() => serverApiJson<RenterOrderDetail>(
    API_ENDPOINTS.backend.rental.order(id),
    "Không thể tải đơn thuê.",
  ));
  if (!result.success) return <PaymentResultError href={href} />;

  const order = result.data;
  let invoice: Invoice | null = null;
  if (normalizeOrderStatus(order.paymentState) !== "PAID" && order.invoiceRef) {
    const invoiceResult = await serverApiResult(() => serverApiJson<Invoice>(
      API_ENDPOINTS.backend.payment.invoice(order.invoiceRef!),
      "Không thể tải kết quả thanh toán.",
    ));
    if (!invoiceResult.success) return <PaymentResultError href={href} />;
    invoice = invoiceResult.data;
  }

  // Opening this URL cannot turn an unpaid order into a successful payment.
  const progress = getOrderPaymentProgress(order.status, order.paymentState, invoice?.status ?? "");
  if (!progress.showSuccess) redirect(detailHref);

  return (
    <div className="flex flex-1 items-center bg-[#f5f7fa] py-8 sm:py-12">
      <Container className="max-w-3xl">
        <OrderPaymentProvider initialOrder={getOrderPaymentSnapshot(order)} initialInvoice={invoice} key={order.orderId}>
          <OrderPaymentSuccess />
        </OrderPaymentProvider>
      </Container>
    </div>
  );
}
