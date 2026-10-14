"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { EquipmentAvailabilityCheckResponse } from "@/types/inventory";
import { cn } from "@/utils/cn";

export function ProductAvailabilityStatus({
  availability,
  isChecking,
  isError,
  onRetry,
}: {
  availability: EquipmentAvailabilityCheckResponse | null;
  isChecking: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <div aria-busy={isChecking} className="mt-4 text-xs" role="status">
      {isChecking ? (
        <div className="space-y-2">
          <p className="text-muted-foreground">Đang kiểm tra lịch thuê...</p>
          <Skeleton aria-hidden="true" className="h-3 w-4/5" />
        </div>
      ) : isError ? (
        <div className="flex items-start gap-2">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-error"
          />
          <div>
            <p className="font-medium text-error">Chưa kiểm tra được lịch thuê.</p>
            <Button
              className="mt-2 h-7 px-2 text-xs"
              onClick={onRetry}
              size="sm"
              variant="secondary"
            >
              Thử lại
            </Button>
          </div>
        </div>
      ) : availability ? (
        <div className="flex items-start gap-2">
          {availability.isAvailable ? (
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-green-600"
            />
          ) : (
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-amber-600"
            />
          )}
          <div>
            <p
              className={cn(
                "font-medium",
                availability.isAvailable ? "text-green-700" : "text-amber-700",
              )}
            >
              {availability.isAvailable
                ? `Có đủ ${availability.requestedQuantity} thiết bị cho lịch thuê này`
                : "Không đủ thiết bị cho lịch thuê này"}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
              {availability.isAvailable
                ? `Còn ${availability.availableQuantity} thiết bị trong suốt thời gian đã chọn.`
                : `Bạn cần ${availability.requestedQuantity} thiết bị, hiện còn ${availability.availableQuantity}. Hãy giảm số lượng hoặc đổi ngày thuê.`}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
