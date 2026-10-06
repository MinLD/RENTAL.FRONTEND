import type { ReactNode } from "react";

type CatalogPlaceholderProps = {
  description: string;
  title: string;
  toolbar?: ReactNode;
};

export function CatalogPlaceholder({
  description,
  title,
  toolbar,
}: CatalogPlaceholderProps) {
  return (
    <section className="grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
      <div className="shrink-0 border-b border-border p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          {toolbar}
        </div>
      </div>

      <div className="grid min-h-0 place-items-center p-6 text-center">
        <div className="max-w-md space-y-2">
          <h3 className="text-base font-bold text-foreground">
            Sẽ triển khai ở step tiếp theo
          </h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Màn này đã được đặt đúng vị trí trong Catalog admin để tiếp tục làm
            category/equipment type mà không thêm mục sidebar mới.
          </p>
        </div>
      </div>
    </section>
  );
}
