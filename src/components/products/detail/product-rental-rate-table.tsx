import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EquipmentListingRentalRateResponse } from "@/types/inventory";
import { formatEquipmentListingRate } from "@/utils/inventory";
import {
  RENTAL_DAYS_PER_MONTH,
  RENTAL_DAYS_PER_WEEK,
} from "@/utils/rental-pricing";

export function ProductRentalRateTable({
  rentalRate,
}: {
  rentalRate: EquipmentListingRentalRateResponse | null;
}) {
  const rates = [
    { label: "Theo ngày", amount: rentalRate?.dailyRate },
    { label: "Theo tuần", amount: rentalRate?.weeklyRate },
    { label: "Theo tháng", amount: rentalRate?.monthlyRate },
  ];
  return (
    <div>
      <div className="overflow-hidden rounded border border-border">
        <Table aria-label="Bảng giá thuê thiết bị">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Hình thức thuê</TableHead>
              <TableHead className="text-right" scope="col">
                Giá thuê / thiết bị
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map(({ label, amount }) => (
              <TableRow key={label}>
                <TableHead
                  className="h-auto py-3 text-sm font-medium text-foreground"
                  scope="row"
                >
                  {label}
                </TableHead>
                <TableCell className="text-right font-semibold text-primary">
                  {amount != null && Number.isFinite(amount) && amount >= 0
                    ? formatEquipmentListingRate(amount, rentalRate?.currency)
                    : "Liên hệ"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        Giá thuê tham khảo cho một thiết bị, chưa bao gồm vận chuyển và các chi
        phí phát sinh. Một tháng tính {RENTAL_DAYS_PER_MONTH} ngày, một tuần
        tính {RENTAL_DAYS_PER_WEEK} ngày; thời gian thuê được tách thành tháng,
        tuần và ngày lẻ.
      </p>
    </div>
  );
}
