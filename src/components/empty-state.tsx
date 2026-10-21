import type { ReactNode } from "react";
import { PackageSearch } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  illustration?: ReactNode;
  action?: ReactNode;
  className?: string;
  role?: "status" | "alert";
};

export function EmptyState({
  title,
  description,
  icon,
  illustration,
  action,
  className,
  role = "status",
}: EmptyStateProps) {
  return (
    <Empty className={className} role={role}>
      <EmptyHeader>
        <EmptyMedia
          aria-hidden="true"
          className={illustration ? "h-auto w-full max-w-64 rounded-none bg-transparent [&_svg]:h-auto [&_svg]:w-full" : undefined}
        >
          {illustration ?? icon ?? <PackageSearch />}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
