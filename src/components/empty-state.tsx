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
  action?: ReactNode;
  className?: string;
  role?: "status" | "alert";
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  role = "status",
}: EmptyStateProps) {
  return (
    <Empty className={className} role={role}>
      <EmptyHeader>
        <EmptyMedia aria-hidden="true">{icon ?? <PackageSearch />}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description ? (
          <EmptyDescription>{description}</EmptyDescription>
        ) : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
