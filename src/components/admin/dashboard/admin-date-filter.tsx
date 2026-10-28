"use client";

import { useId, useState } from "react";
import { AlertCircle, Calendar, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTodayDateString,
  offsetDate,
  validateAnalyticsDateRange,
} from "@/utils/analytics";

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

  const [prevProps, setPrevProps] = useState({ from, to });
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (prevProps.from !== from || prevProps.to !== to) {
    setPrevProps({ from, to });
    setDraftFrom(from);
    setDraftTo(to);
    setValidationError(null);
  }

  const handlePreset = (preset: DatePreset) => {
    let newFrom = from;
    const newTo = today;

    if (preset === "7d") {
      newFrom = offsetDate(today, -6);
    } else if (preset === "30d") {
      newFrom = offsetDate(today, -29);
    } else if (preset === "this-month") {
      newFrom = `${today.slice(0, 7)}-01`;
    }

    const validation = validateAnalyticsDateRange(newFrom, newTo);
    if (validation.valid) {
      setDraftFrom(newFrom);
      setDraftTo(newTo);
      setValidationError(null);
      onDateChange(newFrom, newTo);
    }
  };

  const handleApplyCustom = () => {
    const validation = validateAnalyticsDateRange(draftFrom, draftTo);
    if (!validation.valid) {
      setValidationError(validation.error ?? "Khoảng ngày không hợp lệ.");
      return;
    }
    setValidationError(null);
    onDateChange(draftFrom, draftTo);
  };

  const is7d = from === offsetDate(today, -6) && to === today;
  const is30d = from === offsetDate(today, -29) && to === today;
  const isThisMonth = from === `${today.slice(0, 7)}-01` && to === today;
  const isDirty = draftFrom !== from || draftTo !== to;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-xs">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Các nút chọn nhanh */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground mr-1">
            <Calendar className="size-3.5" />
            Khoảng thời gian:
          </span>
          <button
            type="button"
            onClick={() => handlePreset("7d")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              is7d
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            7 ngày
          </button>
          <button
            type="button"
            onClick={() => handlePreset("30d")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              is30d
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            30 ngày
          </button>
          <button
            type="button"
            onClick={() => handlePreset("this-month")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              isThisMonth
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Tháng này
          </button>
        </div>

        {/* Chọn ngày tùy chỉnh (nháp) & Nút áp dụng & Nút làm mới */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <label htmlFor={fromInputId} className="sr-only">
              Từ ngày
            </label>
            <input
              id={fromInputId}
              type="date"
              max={draftTo || today}
              value={draftFrom}
              onChange={(e) => {
                setDraftFrom(e.target.value);
                setValidationError(null);
              }}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <span>đến</span>
            <label htmlFor={toInputId} className="sr-only">
              Đến ngày
            </label>
            <input
              id={toInputId}
              type="date"
              min={draftFrom}
              max={today}
              value={draftTo}
              onChange={(e) => {
                setDraftTo(e.target.value);
                setValidationError(null);
              }}
              className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {isDirty && (
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleApplyCustom}
            >
              <Check className="size-3.5" />
              Áp dụng
            </Button>
          )}

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

      {/* Thông báo lỗi validation */}
      {validationError && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}
