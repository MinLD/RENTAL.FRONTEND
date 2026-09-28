import type { ComponentProps } from "react";

import { cn } from "@/utils/cn";

function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full caption-bottom text-sm", className)}
      data-slot="table"
      {...props}
    />
  );
}

function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn("[&_tr]:border-b", className)}
      data-slot="table-header"
      {...props}
    />
  );
}

function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0", className)}
      data-slot="table-body"
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className,
      )}
      data-slot="table-footer"
      {...props}
    />
  );
}

function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/60 data-[state=selected]:bg-muted",
        className,
      )}
      data-slot="table-row"
      {...props}
    />
  );
}

function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-xs font-bold text-muted-foreground",
        className,
      )}
      data-slot="table-head"
      {...props}
    />
  );
}

function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn("px-4 py-3 align-middle", className)}
      data-slot="table-cell"
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return (
    <caption
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      data-slot="table-caption"
      {...props}
    />
  );
}

export {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
