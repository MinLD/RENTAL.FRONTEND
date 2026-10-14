import type { RentalPriceEstimate } from "@/utils/rental-pricing";
import { formatEquipmentListingRate } from "@/utils/inventory";

export function ProductRentalPriceBreakdown({
  estimate,
  currency,
}: {
  estimate: RentalPriceEstimate | null;
  currency?: string | null;
}) {
  return estimate?.lines.map((line) => (
    <div className="flex items-start justify-between gap-3" key={line.unit}>
      <dt className="text-muted-foreground">
        {line.count} {line.label}
        <span className="mt-1 block text-[10px]">
          {line.count} × {formatEquipmentListingRate(line.rate, currency)}
        </span>
      </dt>
      <dd className="text-right font-medium">
        {formatEquipmentListingRate(line.subtotal, currency)}
      </dd>
    </div>
  ));
}
