import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutPayment } from "@/components/checkout/checkout-payment";
import { ErrorState } from "@/components/error-state";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { QueryProvider } from "@/providers/query-provider";
import { serverApiJson, serverApiResult } from "@/services/server-api";
import { getCurrentUser } from "@/services/session-service";
import type { CheckoutOperation } from "@/types/checkout";
import { withReturnTo } from "@/utils/return-to";

type PaymentParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function CheckoutPaymentPage({
  searchParams,
}: {
  searchParams: Promise<PaymentParams>;
}) {
  const params = await searchParams;
  const operationId = first(params.operationId);
  const directOrderId = first(params.orderId);
  if ((!operationId && !directOrderId) || (operationId && directOrderId)) {
    return (
      <Container className="py-12">
        <ErrorState
          action={<Button asChild><Link href="/search">Tìm thiết bị</Link></Button>}
          title="Không tìm thấy lần đặt thuê"
        />
      </Container>
    );
  }

  const currentHref = `/checkout/payment?${operationId ? `operationId=${encodeURIComponent(operationId)}` : `orderId=${encodeURIComponent(directOrderId!)}`}`;
  const user = await getCurrentUser();
  if (!user) redirect(withReturnTo("/login", currentHref));
  if (directOrderId) redirect(`/orders/${encodeURIComponent(directOrderId)}`);

  const operationResult = operationId
    ? await serverApiResult(() => serverApiJson<CheckoutOperation>(
      API_ENDPOINTS.backend.rental.checkoutOperation(operationId),
      "Không thể kiểm tra lần gửi đơn.",
    ))
    : null;
  if (operationResult && !operationResult.success) {
    return (
      <Container className="py-12">
        <ErrorState
          action={<Button asChild><Link href={currentHref}>Thử lại</Link></Button>}
          description="Không thể kiểm tra trạng thái đơn lúc này."
          title="Không thể tải thông tin thanh toán"
        />
      </Container>
    );
  }

  const initialOperation = operationResult?.success ? operationResult.data : null;
  if (initialOperation?.orderId && initialOperation.status?.toUpperCase() === "SUCCEEDED") {
    redirect(`/orders/${encodeURIComponent(initialOperation.orderId)}`);
  }

  return (
    <QueryProvider>
      <CheckoutPayment
        initialOperation={initialOperation}
        operationId={operationId ?? null}
      />
    </QueryProvider>
  );
}
