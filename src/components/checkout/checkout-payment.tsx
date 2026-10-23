"use client";

import { useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ErrorState } from "@/components/error-state";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { getCheckoutOperation } from "@/services/checkout-service";
import type { CheckoutOperation } from "@/types/checkout";

const POLL_INTERVAL_MS = 2_000;

function normalized(value: string | null | undefined) {
  return value?.toUpperCase().replaceAll("-", "_") ?? "";
}

function isOperationFailed(status: string | null | undefined) {
  return ["FAILED", "REJECTED", "CANCELLED"].includes(normalized(status));
}

export function CheckoutPayment({
  initialOperation,
  operationId,
}: {
  initialOperation: CheckoutOperation | null;
  operationId: string | null;
}) {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["checkout-operation", operationId],
    queryFn: () => getCheckoutOperation(operationId!),
    enabled: Boolean(operationId),
    initialData: initialOperation ?? undefined,
    refetchInterval: (current) => {
      const operation = current.state.data;
      return isOperationFailed(operation?.status) || (normalized(operation?.status) === "SUCCEEDED" && operation?.orderId)
        ? false
        : POLL_INTERVAL_MS;
    },
    retry: 1,
  });
  const operation = query.data;
  const orderId = operation?.orderId;
  const failed = isOperationFailed(operation?.status);

  useEffect(() => {
    if (orderId && normalized(operation?.status) === "SUCCEEDED") {
      router.replace(`/orders/${encodeURIComponent(orderId)}`);
    }
  }, [operation?.status, orderId, router]);

  return (
    <div className="flex-1 bg-[#f5f7fa] py-8">
      <Container className="max-w-3xl">
        <div className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-8">
          {query.isError && !operation ? (
            <ErrorState
              action={<Button onClick={() => void query.refetch()}>Thử lại</Button>}
              description="Chưa xác định được đơn đã tạo hay chưa. Vui lòng kiểm tra lại trước khi gửi đơn mới."
              title="Không thể kiểm tra trạng thái đơn"
            />
          ) : failed ? (
            <ErrorState
              action={<Button asChild><Link href="/orders">Xem đơn thuê của tôi</Link></Button>}
              description={operation?.errorMessage ?? "Đơn thuê chưa được tạo. Vui lòng thử lại từ trang thiết bị."}
              title="Không thể tạo đơn thuê"
            />
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center text-center" role="status">
              <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-primary" />
              <h1 className="mt-4 text-lg font-semibold">Đang chuẩn bị chi tiết đơn thuê</h1>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Đơn vừa gửi đang được xử lý. Trang sẽ tự chuyển tới chi tiết đơn ngay khi tạo xong.</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
