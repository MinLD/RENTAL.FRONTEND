"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMonthDays, shiftMonth } from "@/utils/calendar";
import { cn } from "@/utils/cn";

export function MonthCalendar({
  month,
  onMonthChange,
  today,
  isLoading,
  onRefresh,
  renderDay,
  legend,
  errorState,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  today: string;
  isLoading?: boolean;
  onRefresh: () => void;
  renderDay: (date: string) => ReactNode;
  legend?: ReactNode;
  errorState?: ReactNode;
}) {
  const monthId = useId();
  return (
    <section aria-label="Lịch theo tháng" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            aria-label="Tháng trước"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <label className="sr-only" htmlFor={monthId}>
            Chọn tháng
          </label>
          <input
            className="h-10 w-44 rounded border border-input bg-background px-3 text-sm font-semibold outline-none focus:border-primary"
            id={monthId}
            onChange={(event) => {
              if (/^\d{4}-\d{2}$/.test(event.target.value))
                onMonthChange(event.target.value);
            }}
            type="month"
            value={month}
          />
          <Button
            aria-label="Tháng sau"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            onClick={() => onMonthChange(today.slice(0, 7))}
            size="sm"
            type="button"
            variant="ghost"
          >
            Tháng này
          </Button>
        </div>
        <Button
          disabled={isLoading}
          onClick={onRefresh}
          size="sm"
          type="button"
          variant="secondary"
        >
          <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          Tải lại
        </Button>
      </div>
      {legend}
      {errorState ?? (
        <div className="overflow-x-auto rounded border border-border">
          <div aria-busy={isLoading} className="min-w-[700px]">
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
              {[
                "Thứ 2",
                "Thứ 3",
                "Thứ 4",
                "Thứ 5",
                "Thứ 6",
                "Thứ 7",
                "Chủ nhật",
              ].map((day) => (
                <div
                  className="p-3 text-center text-xs font-semibold text-muted-foreground"
                  key={day}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {getMonthDays(month).map((date, index) => (
                <div
                  className={cn(
                    "min-h-32 border-b border-r border-border p-3 [&:nth-child(7n)]:border-r-0",
                    !date && "bg-muted/20",
                    date === today && "bg-primary/5",
                  )}
                  key={date ?? `blank-${index}`}
                >
                  {date ? (
                    <>
                      <span
                        className={cn(
                          "mb-2 inline-flex size-6 items-center justify-center rounded-full text-sm font-semibold",
                          date === today &&
                            "bg-primary text-primary-foreground",
                        )}
                      >
                        {Number(date.slice(-2))}
                      </span>
                      {isLoading ? (
                        <Skeleton className="mt-2 h-12 w-full" />
                      ) : (
                        renderDay(date)
                      )}
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
