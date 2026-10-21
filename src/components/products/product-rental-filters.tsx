"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import { parsePublicEquipmentListingListParams } from "@/lib/validations/public-equipment-search";
import type { ProductBrowseData } from "@/types/product-browse";

export function ProductRentalFilters({
  filters,
}: Pick<ProductBrowseData, "filters">) {
  const { isPending, navigate } = useProductBrowseNavigation();
  const id = useId();
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const [quantity, setQuantity] = useState(
    String(filters.requestedQuantity ?? ""),
  );
  const [error, setError] = useState("");

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const next = parsePublicEquipmentListingListParams({
        ...filters,
        from: from || undefined,
        to: to || undefined,
        requestedQuantity: quantity.trim() ? Number(quantity) : undefined,
      });
      setError("");
      navigate({
        from: next.from,
        to: next.to,
        requestedQuantity: next.requestedQuantity,
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Vui lòng kiểm tra lại lịch thuê.",
      );
    }
  }

  return (
    <form
      className="space-y-3 border-t border-border pt-4"
      noValidate
      onSubmit={apply}
    >
      <fieldset className="min-w-0 space-y-3" disabled={isPending}>
        <legend className="mb-2 text-[11px] font-bold uppercase">
          Lịch thuê &amp; số lượng
        </legend>
        <label
          className="block min-w-0 space-y-1.5 text-xs"
          htmlFor={`${id}-from`}
        >
          <span className="block">Từ ngày</span>
          <Input
            className="h-9 min-w-0 px-2 text-xs md:text-xs"
            id={`${id}-from`}
            onChange={(event) => {
              setFrom(event.target.value);
              setError("");
            }}
            type="date"
            value={from}
          />
        </label>
        <label
          className="block min-w-0 space-y-1.5 text-xs"
          htmlFor={`${id}-to`}
        >
          <span className="block">Đến ngày</span>
          <Input
            className="h-9 min-w-0 px-2 text-xs md:text-xs"
            id={`${id}-to`}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value);
              setError("");
            }}
            type="date"
            value={to}
          />
        </label>
        <label
          className="block space-y-1.5 text-xs"
          htmlFor={`${id}-quantity`}
        >
          <span className="block">Số lượng cần thuê</span>
          <Input
            className="h-9 px-2 text-xs md:text-xs"
            id={`${id}-quantity`}
            min={1}
            onChange={(event) => {
              setQuantity(event.target.value);
              setError("");
            }}
            placeholder="Không bắt buộc"
            step={1}
            type="number"
            value={quantity}
          />
        </label>
      </fieldset>
      {error ? (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button className="w-full" disabled={isPending} size="sm" type="submit">
        {isPending ? "Đang lọc..." : "Áp dụng"}
      </Button>
    </form>
  );
}
