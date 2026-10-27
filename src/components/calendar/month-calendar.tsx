"use client";

import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
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
  productSelector,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  today: string;
  isLoading?: boolean;
  onRefresh: () => void;
  renderDay: (date: string) => ReactNode;
  legend?: ReactNode;
  errorState?: ReactNode;
  productSelector?: ReactNode;
}) {
  const monthId = useId();
  const [year, monthNum] = month.split("-");
  const isCurrentMonth = today.slice(0, 7) === month;

  return (
    <section aria-label="Lịch theo tháng" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            aria-label="Tháng trước"
            className="size-9"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="relative inline-flex items-center">
            <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-semibold text-foreground shadow-2xs transition-colors hover:border-primary">
              <Calendar className="size-4 text-primary" />
              <span>
                Tháng {Number(monthNum)}, {year}
              </span>
            </div>
            <input
              aria-label="Chọn tháng"
              className="absolute inset-0 cursor-pointer opacity-0"
              id={monthId}
              onChange={(event) => {
                if (/^\d{4}-\d{2}$/.test(event.target.value))
                  onMonthChange(event.target.value);
              }}
              type="month"
              value={month}
            />
          </div>
          <Button
            aria-label="Tháng sau"
            className="size-9"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
            size="icon"
            type="button"
            variant="secondary"
          >
            <ChevronRight className="size-4" />
          </Button>
          {productSelector}
          {!isCurrentMonth ? (
            <Button
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onMonthChange(today.slice(0, 7))}
              size="sm"
              type="button"
              variant="ghost"
            >
              Về tháng này
            </Button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          {legend}
          <Button
            className="h-9 shrink-0"
            disabled={isLoading}
            onClick={onRefresh}
            size="sm"
            type="button"
            variant="secondary"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Tải lại</span>
          </Button>
        </div>
      </div>
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
                    "min-h-28 border-b border-r border-border/70 p-2 sm:min-h-32 sm:p-2.5 [&:nth-child(7n)]:border-r-0",
                    !date && "bg-muted/15",
                    date === today && "bg-primary/[0.03] ring-1 ring-inset ring-primary/25",
                  )}
                  key={date ?? `blank-${index}`}
                >
                  {date ? (
                    <>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                            date === today
                              ? "bg-primary font-bold text-primary-foreground shadow-xs"
                              : "text-foreground/90",
                          )}
                        >
                          {Number(date.slice(-2))}
                        </span>
                        {date === today ? (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                            Hôm nay
                          </span>
                        ) : null}
                      </div>
                      {isLoading ? (
                        <Skeleton className="mt-1 h-10 w-full rounded" />
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
