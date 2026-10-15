"use client";

import { useState } from "react";
import { ArrowRight, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useEquipmentAvailability } from "@/hooks/use-equipment-availability";
import type { EquipmentListingRentalRateResponse } from "@/types/inventory";
import { formatEquipmentListingRate } from "@/utils/inventory";
import { formatRentalDate, getRentalDayCount } from "@/utils/product-detail";
import {
  calculateRentalPrice,
  RENTAL_DAYS_PER_MONTH,
  RENTAL_DAYS_PER_WEEK,
} from "@/utils/rental-pricing";
import { ProductAvailabilityStatus } from "./product-availability-status";
import { ProductRentalPriceBreakdown } from "./product-rental-price-breakdown";

export function ProductRentalPanel({
  listingId,
  name,
  rentalRate,
  depositAmount,
  totalQuantity,
  today,
}: {
  listingId: string;
  name: string;
  rentalRate: EquipmentListingRentalRateResponse | null;
  depositAmount?: number | null;
  totalQuantity: number;
  today: string;
}) {
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [quantityInput, setQuantityInput] = useState("1");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const quantity = Number(quantityInput);
  const maxQuantity = Number.isFinite(totalQuantity)
    ? Math.max(0, Math.floor(totalQuantity))
    : 0;
  const days = getRentalDayCount(from, to);
  const dailyRate = rentalRate?.dailyRate;
  const hasDailyRate =
    dailyRate != null && Number.isFinite(dailyRate) && dailyRate >= 0;
  let error: string | null = null;
  if (!from || !to) error = "Vui lòng chọn đủ ngày bắt đầu và ngày kết thúc.";
  else if (from < today) error = "Ngày bắt đầu thuê không được trước hôm nay.";
  else if (!days) error = "Ngày kết thúc phải từ ngày bắt đầu thuê trở đi.";
  else if (!maxQuantity) error = "Thiết bị hiện chưa có số lượng để thuê.";
  else if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > maxQuantity
  )
    error = `Chọn số lượng từ 1 đến ${maxQuantity} thiết bị.`;
  const availabilityCheck = useEquipmentAvailability(
    listingId,
    error ? null : { startDate: from, endDate: to, requestedQuantity: quantity },
  );
  const estimate = !error
    ? calculateRentalPrice(days, quantity, rentalRate)
    : null;
  const price = (value: number | null | undefined) =>
    formatEquipmentListingRate(value, rentalRate?.currency);
  const deposit =
    depositAmount != null && Number.isFinite(depositAmount) && depositAmount >= 0
      ? formatEquipmentListingRate(depositAmount, rentalRate?.currency ?? "VND")
      : "Liên hệ";

  function changeStart(value: string) {
    setFrom(value);
    if (value && to < value) setTo(value);
  }
  function changeQuantity(step: number) {
    const current = Number.isSafeInteger(quantity) ? quantity : 1;
    setQuantityInput(
      String(Math.min(maxQuantity, Math.max(1, current + step))),
    );
  }

  return (
    <aside
      aria-label="Thông tin thuê thiết bị"
      className="min-w-0 lg:sticky lg:top-[calc(var(--site-header-height,8rem)+1.5rem)] lg:col-start-2 lg:row-start-1 lg:row-span-2"
    >
      <div className="mb-6">
        <p className="text-2xl font-bold text-primary sm:text-3xl">
          {hasDailyRate ? price(dailyRate) : "Liên hệ"}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            / ngày
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Giá thuê tham khảo</p>
        <dl className="mt-4 flex justify-between gap-3 text-xs">
          <dt className="text-muted-foreground">Tiền cọc</dt>
          <dd className="font-semibold" data-testid="rental-deposit">
            {deposit}
          </dd>
        </dl>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="min-w-0 space-y-2 text-[10px] font-semibold uppercase text-muted-foreground">
          <span>Ngày bắt đầu thuê</span>
          <Input
            className="min-w-0 px-2 text-xs md:text-xs"
            min={today}
            onChange={(event) => changeStart(event.target.value)}
            type="date"
            value={from}
          />
        </label>
        <label className="min-w-0 space-y-2 text-[10px] font-semibold uppercase text-muted-foreground">
          <span>Ngày kết thúc thuê</span>
          <Input
            className="min-w-0 px-2 text-xs md:text-xs"
            min={from || today}
            onChange={(event) => setTo(event.target.value)}
            type="date"
            value={to}
          />
        </label>
      </div>
      <div className="mt-5 space-y-2">
        <label className="text-xs font-semibold" htmlFor="rental-quantity">
          Số lượng thiết bị
        </label>
        <div className="flex items-center gap-3">
          <div className="flex items-center overflow-hidden rounded border border-border">
            <Button
              aria-label="Giảm số lượng"
              className="size-8 rounded-none"
              disabled={quantity <= 1 || !maxQuantity}
              onClick={() => changeQuantity(-1)}
              size="icon"
              variant="ghost"
            >
              <Minus aria-hidden="true" className="size-3.5" />
            </Button>
            <input
              aria-describedby={error ? "rental-validation" : undefined}
              aria-invalid={Boolean(
                error &&
                (quantity < 1 ||
                  quantity > maxQuantity ||
                  !Number.isSafeInteger(quantity)),
              )}
              className="h-8 w-12 border-x border-border p-0 text-center text-xs font-semibold tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none focus-visible:ring-2 focus-visible:ring-primary"
              id="rental-quantity"
              inputMode="numeric"
              max={maxQuantity}
              min={1}
              onChange={(event) => setQuantityInput(event.target.value)}
              type="number"
              value={quantityInput}
            />
            <Button
              aria-label="Tăng số lượng"
              className="size-8 rounded-none"
              disabled={quantity >= maxQuantity || !maxQuantity}
              onClick={() => changeQuantity(1)}
              size="icon"
              variant="ghost"
            >
              <Plus aria-hidden="true" className="size-3.5" />
            </Button>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Tối đa {maxQuantity} thiết bị
          </span>
        </div>
      </div>
      {error ? (
        <p
          className="mt-3 text-xs text-error"
          id="rental-validation"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {!error ? (
        <ProductAvailabilityStatus
          availability={availabilityCheck.availability}
          isChecking={availabilityCheck.isChecking}
          isError={availabilityCheck.isError}
          onRetry={() => void availabilityCheck.refetch()}
        />
      ) : null}
      <div className="mt-6 border-t border-border pt-4">
        <h2 className="mb-3 text-xs font-semibold">Dự tính chi phí</h2>
        <dl className="space-y-2.5 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Số ngày thuê</dt>
            <dd>{days || "—"} ngày</dd>
          </div>
          <ProductRentalPriceBreakdown
            estimate={estimate}
            currency={rentalRate?.currency}
          />
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Giá thuê / thiết bị</dt>
            <dd>{price(estimate?.unitTotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Số lượng thiết bị</dt>
            <dd>
              {Number.isSafeInteger(quantity) && quantity > 0 ? quantity : "—"}{" "}
              thiết bị
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <dt className="font-semibold">Tổng tiền thuê dự kiến</dt>
            <dd
              aria-live="polite"
              className="text-lg font-bold text-primary"
              data-testid="rental-total"
            >
              {price(estimate?.total)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
          Quy ước {RENTAL_DAYS_PER_MONTH} ngày/tháng, {RENTAL_DAYS_PER_WEEK}{" "}
          ngày/tuần. Tính cả ngày bắt đầu và kết thúc; chưa gồm tiền cọc,
          vận chuyển và chi phí phát sinh.
        </p>
        {!error && !estimate ? (
          <p className="mt-2 text-xs text-error" role="status">
            Chưa có đủ giá thuê để tính khoảng thời gian này.
          </p>
        ) : null}
      </div>
      <Button
        className="mt-5 w-full"
        disabled={!estimate || !availabilityCheck.availability?.isAvailable}
        onClick={() => setIsPreviewOpen(true)}
      >
        Tiếp tục thuê <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thông tin thuê dự kiến</DialogTitle>
            <DialogDescription>
              Kiểm tra lịch thuê và chi phí tham khảo của bạn.
            </DialogDescription>
          </DialogHeader>
          <p className="font-semibold">{name}</p>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Ngày bắt đầu</dt>
              <dd>{formatRentalDate(from)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Ngày kết thúc</dt>
              <dd>{formatRentalDate(to)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Thời gian thuê</dt>
              <dd>{days} ngày</dd>
            </div>
            <ProductRentalPriceBreakdown
              estimate={estimate}
              currency={rentalRate?.currency}
            />
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Giá thuê / thiết bị</dt>
              <dd>{price(estimate?.unitTotal)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Số lượng</dt>
              <dd>{quantity} thiết bị</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-border pt-3">
              <dt className="font-semibold">Tổng tiền thuê dự kiến</dt>
              <dd className="font-bold text-primary">
                {price(estimate?.total)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Tiền cọc</dt>
              <dd className="font-semibold">{deposit}</dd>
            </div>
          </dl>
          <p className="text-xs leading-6 text-muted-foreground">
            Giá thuê cuối cùng và tình trạng thiết bị cần được nhà cung cấp xác
            nhận.
          </p>
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)} variant="secondary">
              Điều chỉnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
