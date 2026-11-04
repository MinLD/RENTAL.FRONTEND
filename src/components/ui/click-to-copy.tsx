"use client";

import { type ReactNode, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

type ClickToCopyProps = {
  className?: string;
  display?: ReactNode;
  showIcon?: boolean;
  text?: string | null;
};

export function ClickToCopy({
  className,
  display,
  showIcon = true,
  text,
}: ClickToCopyProps) {
  const [copied, setCopied] = useState(false);

  if (!text) return <span className="text-muted-foreground">—</span>;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Đã sao chép: ${text}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className={cn(
        "group/copy inline-flex max-w-full items-center gap-1.5 cursor-pointer rounded px-1 -mx-1 py-0.5 text-left transition-colors hover:bg-muted/70 hover:text-primary",
        className,
      )}
      onClick={handleCopy}
      title={`Bấm để sao chép: ${text}`}
      type="button"
    >
      <span className="truncate">{display ?? text}</span>
      {showIcon ? (
        copied ? (
          <Check className="size-3 shrink-0 text-emerald-600" />
        ) : (
          <Copy className="size-3 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover/copy:opacity-100 group-hover/copy:text-primary" />
        )
      ) : null}
    </button>
  );
}
