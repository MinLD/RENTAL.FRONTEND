import { ProductImage } from "@/components/products/product-image";
import { cn } from "@/utils/cn";

export function BrandLogo({
  name,
  src,
  sizes = "200px",
  className,
}: {
  name: string;
  src?: string | null;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <ProductImage
        compact
        fallback={
          <span className="line-clamp-2 px-1 text-sm font-semibold text-primary">
            {name}
          </span>
        }
        imageClassName="object-contain group-hover:scale-100"
        maxRetries={2}
        name={name}
        role="thumbnail"
        sizes={sizes}
        src={src}
      />
    </div>
  );
}
