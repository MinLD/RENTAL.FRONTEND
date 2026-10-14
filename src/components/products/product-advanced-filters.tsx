"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import { parsePublicEquipmentListingListParams } from "@/lib/validations/public-equipment-search";
import type { PublicEquipmentListingSpecFilter } from "@/types/inventory";
import type { ProductBrowseData } from "@/types/product-browse";
import { ProductRefreshButton } from "./product-refresh-button";

type SpecificationDraft = {
  field: string;
  operator: PublicEquipmentListingSpecFilter["operator"];
  value: string;
};

const controlClass = "h-8 min-w-0 rounded border border-input bg-background px-2 text-xs outline-none focus:border-primary disabled:opacity-60";
const dateControlClass = "h-9 min-w-0 px-2 text-xs md:text-xs [&::-webkit-datetime-edit]:p-0 [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:size-3.5";
const supportedTypes = new Set(["number", "integer", "text", "string", "boolean", "enum"]);
const operators = [
  ["eq", "= Bằng"],
  ["gte", "≥ Từ"],
  ["lte", "≤ Đến"],
  ["gt", "> Lớn hơn"],
  ["lt", "< Nhỏ hơn"],
] as const;

function readFilters(serialized?: string): PublicEquipmentListingSpecFilter[] {
  if (!serialized) return [];
  try {
    const parsed = parsePublicEquipmentListingListParams({ filters: serialized });
    return JSON.parse(parsed.filters ?? "[]");
  } catch {
    return [];
  }
}

export function ProductAdvancedFilters({
  filters,
  specificationFields,
}: Pick<ProductBrowseData, "filters" | "specificationFields">) {
  const { isPending, navigate } = useProductBrowseNavigation();
  const id = useId();
  const fields = specificationFields?.success
    ? specificationFields.data.filter((field) => field.filterable && field.key && supportedTypes.has(field.dataType ?? ""))
    : [];
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const [quantity, setQuantity] = useState(String(filters.requestedQuantity ?? ""));
  const [error, setError] = useState("");
  const [specificationsChanged, setSpecificationsChanged] = useState(false);
  const [drafts, setDrafts] = useState<SpecificationDraft[]>(() => {
    const applied = readFilters(filters.filters);
    return fields.flatMap((field) => {
      const matches = applied.filter((filter) => filter.field === field.key);
      return matches.length
        ? matches.map((filter) => ({ ...filter, value: String(filter.value) }))
        : [{ field: field.key!, operator: "eq" as const, value: "" }];
    });
  });

  function updateDraft(index: number, changes: Partial<SpecificationDraft>) {
    setDrafts((current) => current.map((draft, position) => position === index ? { ...draft, ...changes } : draft));
    setSpecificationsChanged(true);
    setError("");
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      let serialized = filters.filters;
      if (specificationsChanged) {
        // Keep URL conditions outside the editable fields, including multiple bounds.
        const conditions = readFilters(filters.filters).filter((filter) => !fields.some((field) => field.key === filter.field));
        for (const draft of drafts) {
          const value = draft.value.trim();
          if (!value) continue;
          const field = fields.find((field) => field.key === draft.field)!;
          const numeric = field.dataType === "number" || field.dataType === "integer";
          if (numeric && !Number.isFinite(Number(value))) {
            throw new Error(`${field.label ?? field.key} phải là một số hợp lệ.`);
          }
          conditions.push({
            field: draft.field,
            operator: numeric ? draft.operator : "eq",
            value: numeric ? Number(value) : field.dataType === "boolean" ? value === "true" : value,
          });
        }
        serialized = conditions.length ? JSON.stringify(conditions) : undefined;
      }
      const next = parsePublicEquipmentListingListParams({
        ...filters,
        from: from || undefined,
        to: to || undefined,
        requestedQuantity: quantity.trim() ? Number(quantity) : undefined,
        filters: serialized,
      });
      setError("");
      navigate({ from: next.from, to: next.to, requestedQuantity: next.requestedQuantity, filters: next.filters });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Vui lòng kiểm tra lại bộ lọc.");
    }
  }

  return (
    <form className="space-y-4 border-t border-border pt-4" noValidate onSubmit={apply}>
      <fieldset className="min-w-0 space-y-3" disabled={isPending}>
        <legend className="mb-2 text-[11px] font-bold uppercase">Lịch thuê & số lượng</legend>
        <div className="grid min-w-0 gap-3">
          <label className="block min-w-0 space-y-1.5 text-xs" htmlFor={`${id}-from`}>
            <span className="block">Từ ngày</span>
            <Input className={dateControlClass} id={`${id}-from`} onChange={(event) => { setFrom(event.target.value); setError(""); }} type="date" value={from} />
          </label>
          <label className="block min-w-0 space-y-1.5 text-xs" htmlFor={`${id}-to`}>
            <span className="block">Đến ngày</span>
            <Input className={dateControlClass} id={`${id}-to`} min={from || undefined} onChange={(event) => { setTo(event.target.value); setError(""); }} type="date" value={to} />
          </label>
        </div>
        <label className="block space-y-1.5 text-xs" htmlFor={`${id}-quantity`}>
          <span className="block">Số lượng cần thuê</span>
          <Input className="h-9 px-2 text-xs md:text-xs" id={`${id}-quantity`} min={1} onChange={(event) => { setQuantity(event.target.value); setError(""); }} placeholder="Không bắt buộc" step={1} type="number" value={quantity} />
        </label>
      </fieldset>
      <details open={Boolean(filters.equipmentTypeId)}>
        <summary className="cursor-pointer text-[11px] font-bold uppercase">Thông số kỹ thuật</summary>
        <div className="mt-3 space-y-3">
          {!filters.equipmentTypeId ? (
            <p className="text-xs text-muted-foreground">Chọn loại thiết bị để lọc thông số.</p>
          ) : specificationFields && !specificationFields.success ? (
            <div className="space-y-2">
              <p className="text-xs text-error" role="alert">Không thể tải thông số.</p>
              <ProductRefreshButton />
            </div>
          ) : fields.length ? (
            <fieldset className="min-w-0 space-y-3" disabled={isPending}>
              <legend className="sr-only">Bộ lọc thông số kỹ thuật</legend>
              {drafts.map((draft, index) => {
                const field = fields.find((field) => field.key === draft.field)!;
                const label = `${field.label ?? field.key}${field.unit ? ` (${field.unit})` : ""}`;
                const fieldId = `${id}-spec-${index}`;
                const numeric = field.dataType === "number" || field.dataType === "integer";
                return (
                  <div className="space-y-1.5" key={fieldId}>
                    <label className="block text-xs" htmlFor={fieldId}>{label}</label>
                    {numeric ? (
                      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-1.5">
                        <select aria-label={`Điều kiện ${label}`} className={controlClass} onChange={(event) => updateDraft(index, { operator: event.target.value as SpecificationDraft["operator"] })} value={draft.operator}>
                          {operators.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
                        </select>
                        <Input className="h-8 px-2 text-xs md:text-xs" id={fieldId} onChange={(event) => updateDraft(index, { value: event.target.value })} placeholder="Giá trị" step="any" type="number" value={draft.value} />
                      </div>
                    ) : field.dataType === "boolean" || field.dataType === "enum" ? (
                      <select className={`${controlClass} w-full`} id={fieldId} onChange={(event) => updateDraft(index, { value: event.target.value })} value={draft.value}>
                        <option value="">Tất cả</option>
                        {field.dataType === "boolean" ? (
                          <><option value="true">Có</option><option value="false">Không</option></>
                        ) : field.options?.filter((option) => option.value != null && option.value !== "").map((option) => <option key={option.value} value={option.value!}>{option.label ?? option.value}</option>)}
                      </select>
                    ) : (
                      <Input className="h-8 text-xs md:text-xs" id={fieldId} onChange={(event) => updateDraft(index, { value: event.target.value })} placeholder="Tất cả" value={draft.value} />
                    )}
                  </div>
                );
              })}
            </fieldset>
          ) : (
            <p className="text-xs text-muted-foreground">Loại thiết bị này chưa có thông số để lọc.</p>
          )}
        </div>
      </details>
      {error ? <p className="text-xs text-error" role="alert">{error}</p> : null}
      <Button className="w-full" disabled={isPending} size="sm" type="submit">{isPending ? "Đang lọc..." : "Áp dụng"}</Button>
    </form>
  );
}
