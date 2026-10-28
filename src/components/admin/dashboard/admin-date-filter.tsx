"use client";

import { useId } from "react";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTodayDateString, offsetDate } from "@/utils/analytics";

export type DatePreset = "7d" | "30d" | "this-month" | "custom";

export function AdminDateFilter({
  from,
  to,
  onDateChange,
  onRefresh,
  isLoading,
}: {
  from: string;
  to: string;
  onDateChange: (from: string, to: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}) {
  const fromInputId = useId();
  const toInputId = useId();
  const today = getTodayDateString();

  const handlePreset = (preset: DatePreset) => {
    if (preset === "7d") {
      onDateChange(offsetDate(today, -6), today);
    } else if (preset === "30d") {
      onDateChange(offsetDate(today, -29), today);
    } else if (preset === "this-month") {
      const firstDay = `${today.slice(0, 7)}-01`;
      onDateChange(firstDay, today);
    }
  };

  const is7d = from === offsetDate(today, -6) && to === today;
  const is30d = from === offsetDate(today, -29) && to === today;
  const isThisMonth = from === `${today.slice(0, 7)}-01` && to === today;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-xs md:flex-row md:items-center md:justify-between">
      {/* Các nút chọn nhanh */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <Calendar className="size-3.5" />
          Kỳ xem:
        </span>
        <button
          type="button"
          onClick={() => handlePreset("7d")}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            is7d
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/70 text-foreground hover:bg-muted"
          }`}
        >
          7 ngày qua
        </button>
        <button
          type="button"
          onClick={() => handlePreset("30d")}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            is30d
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/70 text-foreground hover:bg-muted"
          }`}
        >
          30 ngày qua
        </button>
        <button
          type="button"
          onClick={() => handlePreset("this-month")}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
            isThisMonth
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/70 text-foreground hover:bg-muted"
          }`}
        >
          Tháng này
        </button>
      </div>

      {/* Chọn ngày tùy chỉnh & Nút làm mới */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <label htmlFor={fromInputId} className="sr-only">
            Từ ngày
          </label>
          <input
            id={fromInputId}
            type="date"
            max={to || today}
            value={from}
            onChange={(e) => onDateChange(e.target.value, to)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <span>đến</span>
          <label htmlFor={toInputId} className="sr-only">
            Đến ngày
          </label>
          <input
            id={toInputId}
            type="date"
            min={from}
            max={today}
            value={to}
            onChange={(e) => onDateChange(from, e.target.value)}
            className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>
    </div>
  );
}
