import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { PublicEquipmentListing } from "@/types/inventory";
import {
  formatEquipmentListingRate,
  getEquipmentListingName,
} from "@/utils/inventory";

export function ProductPreview({
  product,
}: {
  product: PublicEquipmentListing;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-8 w-full bg-secondary text-[11px] uppercase text-secondary-foreground hover:bg-secondary/90"
          type="button"
        >
          Xem chi tiết
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getEquipmentListingName(product)}</DialogTitle>
          <DialogDescription>
            {product.description || "Thông tin thiết bị cho thuê."}
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Model</dt>
            <dd className="text-right font-medium">
              {product.model || "Chưa cập nhật"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Năm sản xuất</dt>
            <dd>{product.manufactureYear || "Chưa cập nhật"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Số lượng sẵn sàng</dt>
            <dd>{product.availableQuantity}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Giá thuê / ngày</dt>
            <dd className="font-semibold text-primary">
              {formatEquipmentListingRate(
                product.rentalRate?.dailyRate,
                product.rentalRate?.currency,
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Giá thuê / tuần</dt>
            <dd>
              {formatEquipmentListingRate(
                product.rentalRate?.weeklyRate,
                product.rentalRate?.currency,
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Giá thuê / tháng</dt>
            <dd>
              {formatEquipmentListingRate(
                product.rentalRate?.monthlyRate,
                product.rentalRate?.currency,
              )}
            </dd>
          </div>
        </dl>
      </DialogContent>
    </Dialog>
  );
}
