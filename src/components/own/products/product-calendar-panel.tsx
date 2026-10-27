"use client";

import { useCallback, useMemo, useState } from "react";
import { MonthCalendar } from "@/components/calendar/month-calendar";
import { DataTableState } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useApiResource } from "@/hooks/use-api-resource";
import { getMonthRange, getTodayDate } from "@/utils/calendar";
import type { ProductPageActions } from "./product-management-types";

export function ProductCalendarPanel({
  productId,
  fetchCalendar,
  revision,
}: {
  productId: string;
  fetchCalendar: ProductPageActions["fetchCalendar"];
  revision: number;
}) {
  const [today] = useState(getTodayDate);
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const request = useCallback(() => {
    void revision;
    return fetchCalendar(productId, getMonthRange(month));
  }, [fetchCalendar, productId, month, revision]);
  const calendar = useApiResource(request);
  const days = useMemo(
    () => new Map(calendar.data?.days?.map((day) => [day.date, day])),
    [calendar.data],
  );
  return (
    <div className="space-y-4">
      <div className="border-b border-border/60 pb-3">
        <h2 className="text-base font-bold text-foreground">Chi tiết lịch theo ngày</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Theo dõi tình trạng trống và lịch thuê của sản phẩm trong từng ngày.
        </p>
      </div>
      <MonthCalendar
        errorState={
          calendar.error ? (
            <div className="grid min-h-64 place-items-center">
              <DataTableState message={calendar.error} variant="error" />
              <Button
                onClick={() => void calendar.refresh()}
                type="button"
                variant="secondary"
              >
                Thử lại
              </Button>
            </div>
          ) : undefined
        }
        isLoading={calendar.isLoading}
        legend={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Khả dụng</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-600" />
              <span>Đang sử dụng / Giữ chỗ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>Bị chặn lịch</span>
            </div>
          </div>
        }
        month={month}
        onMonthChange={setMonth}
        onRefresh={() => void calendar.refresh()}
        renderDay={(date) => {
          const day = days.get(date);
          if (!day) {
            return <p className="text-[11px] text-muted-foreground">Chưa có dữ liệu</p>;
          }

          const hasActivity = day.occupiedQuantity > 0 || day.blockedQuantity > 0;

          return (
            <div className="space-y-1.5">
              {!hasActivity ? (
                <div className="flex items-center gap-1.5 rounded-md bg-emerald-50/80 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{day.availableQuantity} khả dụng</span>
                </div>
              ) : (
                <>
                  {day.occupiedQuantity > 0 ? (
                    <div className="flex items-center justify-between gap-1 rounded-md bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="size-1.5 shrink-0 rounded-full bg-blue-600" />
                        <span className="truncate">Đang thuê</span>
                      </span>
                      <span className="font-bold tabular-nums">{day.occupiedQuantity}</span>
                    </div>
                  ) : null}

                  {day.blockedQuantity > 0 ? (
                    <div className="flex items-center justify-between gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <span className="size-1.5 shrink-0 rounded-full bg-amber-600" />
                        <span className="truncate">Bị chặn</span>
                      </span>
                      <span className="font-bold tabular-nums">{day.blockedQuantity}</span>
                    </div>
                  ) : null}

                  {day.availableQuantity > 0 ? (
                    <div className="flex items-center justify-between gap-1 px-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <span className="truncate">Còn trống</span>
                      <span className="font-bold tabular-nums">{day.availableQuantity}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-md bg-rose-50/80 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                      <span className="size-1.5 shrink-0 rounded-full bg-rose-500" />
                      <span>Hết máy</span>
                    </div>
                  )}
                </>
              )}

              {day.suspendedOccupiedQuantity > 0 || day.suspendedBlockedQuantity > 0 ? (
                <p className="px-1 text-[10px] text-muted-foreground">
                  Tạm ngừng: {day.suspendedOccupiedQuantity + day.suspendedBlockedQuantity}
                </p>
              ) : null}
            </div>
          );
        }}
        today={today}
      />
    </div>
  );
}
