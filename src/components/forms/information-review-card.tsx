"use client";

import { Pencil } from "lucide-react";
import { useId, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type InformationReviewCardProps = {
  children: ReactNode;
  disabled?: boolean;
  onEdit?: () => void;
  title: string;
};

export function InformationReviewCard({
  children,
  disabled,
  onEdit,
  title,
}: InformationReviewCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="min-w-0 rounded-xl border border-border/60 bg-background p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground" id={titleId}>
          {title}
        </h2>
        {onEdit ? (
          <Button
            aria-label={`Chỉnh sửa ${title.toLocaleLowerCase("vi")}`}
            disabled={disabled}
            className="shrink-0"
            onClick={onEdit}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Pencil aria-hidden="true" className="size-3.5" /> Chỉnh sửa
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function InformationReviewList({
  rows,
}: {
  rows: readonly { label: string; value?: ReactNode }[];
}) {
  return (
    <dl className="space-y-3 text-sm">
      {rows.map(({ label, value }) => (
        <div
          className="grid gap-1 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-5"
          key={label}
        >
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 whitespace-pre-line break-words text-foreground">
            {value == null || value === "" ? (
              <span className="text-muted-foreground">Chưa cung cấp</span>
            ) : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
