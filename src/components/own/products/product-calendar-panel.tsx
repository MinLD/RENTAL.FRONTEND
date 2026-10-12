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
      <div>
        <h2 className="text-lg font-bold">Lịch sử dụng</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Số máy khả dụng và lịch đang sử dụng theo ngày.
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
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="text-green-700">● Khả dụng</span>
            <span className="text-blue-700">● Đang sử dụng / giữ chỗ</span>
            <span className="text-amber-700">● Bị chặn lịch</span>
          </div>
        }
        month={month}
        onMonthChange={setMonth}
        onRefresh={() => void calendar.refresh()}
        renderDay={(date) => {
          const day = days.get(date);
          return day ? (
            <dl className="space-y-1 text-xs tabular-nums">
              <div className="flex justify-between gap-2 text-green-700">
                <dt>Khả dụng</dt>
                <dd className="font-bold">{day.availableQuantity}</dd>
              </div>
              <div className="flex justify-between gap-2 text-blue-700">
                <dt>Sử dụng</dt>
                <dd>{day.occupiedQuantity}</dd>
              </div>
              <div className="flex justify-between gap-2 text-amber-700">
                <dt>Bị chặn</dt>
                <dd>{day.blockedQuantity}</dd>
              </div>
              {day.suspendedOccupiedQuantity > 0 ||
              day.suspendedBlockedQuantity > 0 ? (
                <p className="pt-1 text-muted-foreground">
                  Máy tạm ngừng: {day.suspendedOccupiedQuantity} sử dụng ·{" "}
                  {day.suspendedBlockedQuantity} bị chặn
                </p>
              ) : null}
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">Chưa có dữ liệu</p>
          );
        }}
        today={today}
      />
    </div>
  );
}
