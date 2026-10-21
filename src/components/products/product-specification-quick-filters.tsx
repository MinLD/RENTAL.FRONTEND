"use client";

import { useState, type FormEvent } from "react";
import { ChevronDown, X } from "lucide-react";
import { Popover, Slider } from "radix-ui";

import { useProductBrowseNavigation } from "@/hooks/use-product-browse-navigation";
import { parsePublicEquipmentListingListParams } from "@/lib/validations/public-equipment-search";
import type { CatalogSpecField } from "@/types/catalog";
import type { PublicEquipmentListingSpecFilter } from "@/types/inventory";
import type { ProductBrowseData } from "@/types/product-browse";
import { formatMoneyInput, getMoneyInputCaret, parseMoneyInput } from "@/utils/money-input";
import { ProductRefreshButton } from "./product-refresh-button";

type Props = Pick<ProductBrowseData, "filters" | "products" | "specificationFields">;

const chipClassName =
  "inline-flex min-h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";
const inputClassName =
  "h-8 w-24 rounded-full border border-[#eadfd8] bg-background px-3 text-xs outline-none focus:border-primary sm:w-28";

function readSpecFilters(serialized?: string): PublicEquipmentListingSpecFilter[] {
  if (!serialized) return [];
  try {
    const parsed = parsePublicEquipmentListingListParams({ filters: serialized });
    return JSON.parse(parsed.filters ?? "[]") as PublicEquipmentListingSpecFilter[];
  } catch {
    return [];
  }
}

export function ProductSpecificationQuickFilters({ filters, products, specificationFields }: Props) {
  const { isPending, navigate } = useProductBrowseNavigation();
  const fields = specificationFields?.success
    ? specificationFields.data.filter(
      (field) => field.filterable && field.key && ["enum", "boolean", "number", "integer", "text", "string"].includes(field.dataType ?? "") &&
        (field.dataType !== "enum" || field.options?.some((option) => option.value != null && option.value !== "")),
    )
    : [];
  const applied = readSpecFilters(filters.filters);

  function replaceField(fieldKey: string, next: PublicEquipmentListingSpecFilter[]) {
    const remaining = applied.filter((filter) => filter.field !== fieldKey);
    const combined = [...remaining, ...next];
    navigate({ filters: combined.length ? JSON.stringify(combined) : undefined });
  }

  if (specificationFields && !specificationFields.success) {
    return (
      <div className="flex items-center gap-3 py-2 text-sm text-error" role="alert">
        <span>Không thể tải thông số kỹ thuật.</span>
        <ProductRefreshButton />
      </div>
    );
  }

  if (!fields.length) {
    return <p className="py-2 text-xs text-muted-foreground">Loại thiết bị này chưa có thông số để lọc.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3 py-2" aria-label="Thông số kỹ thuật của loại thiết bị">
      {fields.map((field) => {
        const key = field.key!;
        const label = `${field.label ?? key}${field.unit ? ` (${field.unit})` : ""}`;
        if (field.dataType === "enum" || field.dataType === "boolean") {
          const options = field.dataType === "boolean"
            ? [{ label: "Có", value: true }, { label: "Không", value: false }]
            : field.options!.filter((option) => option.value != null && option.value !== "").map((option) => ({
              label: option.label ?? option.value!, value: option.value!,
            }));
          const selected = applied.find((filter) => filter.field === key && filter.operator === "eq");
          return (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center" key={key}>
              <span className="shrink-0 text-xs text-muted-foreground">{label}:</span>
              <div aria-label={label} className="flex gap-2 overflow-x-auto pb-1" role="group">
                {options.map((option) => {
                  const active = selected?.value === option.value;
                  return (
                    <button
                      aria-pressed={active}
                      className={`${chipClassName} ${active ? "border-primary bg-primary/5 text-primary" : "border-[#eadfd8]"}`}
                      disabled={isPending}
                      key={String(option.value)}
                      onClick={() => replaceField(key, active ? [] : [{ field: key, operator: "eq", value: option.value }])}
                      type="button"
                    >
                      {option.label}
                      {active ? <X aria-hidden="true" className="size-3" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        const fieldFilters = applied.filter((filter) => filter.field === key);
        const props = {
          applied: fieldFilters,
          field,
          isPending,
          label,
          onApply: (next: PublicEquipmentListingSpecFilter[]) => replaceField(key, next),
        };
        return field.dataType === "number" || field.dataType === "integer" ? (
          <NumericSpecificationPopover
            {...props}
            key={`${filters.equipmentTypeId}-${key}-${filters.filters ?? ""}`}
            visibleValues={products.success ? products.data.items.map((item) => readNumericValue(item.specValues, key)).filter((value): value is number => value !== null) : []}
          />
        ) : (
          <FreeformSpecificationFilter
            {...props}
            key={`${filters.equipmentTypeId}-${key}-${filters.filters ?? ""}`}
          />
        );
      })}
    </div>
  );
}

function readNumericValue(values: Record<string, unknown> | string, key: string): number | null {
  try {
    const parsed = typeof values === "string" ? JSON.parse(values) : values;
    const raw = parsed?.[key];
    const value = typeof raw === "number" || typeof raw === "string" && raw.trim() ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function niceCeiling(value: number) {
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(1, Math.abs(value))));
  return Math.ceil(value / magnitude) * magnitude;
}

function updateGroupedNumberInput(
  input: HTMLInputElement,
  previousValue: string,
  onChange: (value: string) => void,
) {
  const displayedValue = input.value;
  const parsed = parseMoneyInput(displayedValue);
  if (parsed === null) {
    input.value = formatMoneyInput(previousValue);
    return;
  }

  const caret = input.selectionStart ?? displayedValue.length;
  const characterCount = displayedValue.slice(0, caret).replace(/[.\s]/g, "").length;
  const formatted = formatMoneyInput(parsed);
  const nextCaret = getMoneyInputCaret(formatted, characterCount);
  onChange(parsed);
  input.value = formatted;
  input.setSelectionRange(nextCaret, nextCaret);
  requestAnimationFrame(() => {
    if (document.activeElement === input) input.setSelectionRange(nextCaret, nextCaret);
  });
}

function handleGroupedNumberKeyDown(
  event: React.KeyboardEvent<HTMLInputElement>,
  value: string,
  onChange: (value: string) => void,
) {
  const input = event.currentTarget;
  const caret = input.selectionStart;
  if (caret === null || caret !== input.selectionEnd) return;
  let removedIndex: number | null = null;
  if (event.key === "Backspace" && caret > 1 && input.value[caret - 1] === ".") {
    removedIndex = caret - 2;
  } else if (event.key === "Delete" && input.value[caret] === ".") {
    removedIndex = caret + 1;
  }
  if (removedIndex === null) return;
  event.preventDefault();
  input.value = input.value.slice(0, removedIndex) + input.value.slice(removedIndex + 1);
  input.setSelectionRange(event.key === "Backspace" ? removedIndex : caret, event.key === "Backspace" ? removedIndex : caret);
  updateGroupedNumberInput(input, value, onChange);
}

function NumericSpecificationPopover({
  applied,
  field,
  isPending,
  label,
  onApply,
  visibleValues,
}: {
  applied: PublicEquipmentListingSpecFilter[];
  field: CatalogSpecField;
  isPending: boolean;
  label: string;
  onApply: (next: PublicEquipmentListingSpecFilter[]) => void;
  visibleValues: number[];
}) {
  const fieldKey = field.key!;
  const exact = applied.find((filter) => filter.operator === "eq")?.value;
  const lower = Number(applied.find((filter) => filter.operator === "gte" || filter.operator === "gt")?.value ?? exact);
  const upper = Number(applied.find((filter) => filter.operator === "lte" || filter.operator === "lt")?.value ?? exact);
  const min = Math.min(field.min ?? 0, ...visibleValues, Number.isFinite(lower) ? lower : field.min ?? 0);
  const initialMax = Math.max(
    field.max ?? -Infinity,
    ...visibleValues,
    Number.isFinite(upper) ? upper : -Infinity,
    Number.isFinite(lower) ? lower : -Infinity,
    min + 1,
  );
  const max = field.max == null
    ? niceCeiling(Math.max(initialMax, min + 1000))
    : Math.max(field.max, initialMax);
  const [draft, setDraft] = useState([
    Number.isFinite(lower) ? lower : min,
    Number.isFinite(upper) ? upper : max,
  ]);
  const [fromInput, setFromInput] = useState(String(Number.isFinite(lower) ? lower : min));
  const [toInput, setToInput] = useState(String(Number.isFinite(upper) ? upper : max));
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const span = max - min;
  const step = field.dataType === "integer" ? 1 : 10 ** Math.max(-2, Math.floor(Math.log10(span)) - 2);
  const format = (value: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
  const hasDraftSelection = Number(fromInput) !== min || Number(toInput) !== max;
  const hadLowerBoundAtMin = Number.isFinite(lower) && lower === min;
  const hadUpperBoundAtMax = Number.isFinite(upper) && upper === max;

  function apply() {
    const from = fromInput.trim() ? Number(fromInput) : min;
    const to = toInput.trim() ? Number(toInput) : max;
    if (!Number.isFinite(from) || !Number.isFinite(to) || from < min ||
      (field.max != null && (from > max || to > max)) || from > to ||
      (field.dataType === "integer" && (!Number.isInteger(from) || !Number.isInteger(to)))) {
      setError(`Nhập khoảng ${label.toLowerCase()} hợp lệ, từ ${format(min)} trở lên${field.max != null ? ` và không quá ${format(max)}` : ""}.`);
      return;
    }
    onApply([
      ...(from > min || hadLowerBoundAtMin ? [{ field: fieldKey, operator: "gte" as const, value: from }] : []),
      ...(to !== max || hadUpperBoundAtMax ? [{ field: fieldKey, operator: "lte" as const, value: to }] : []),
    ]);
    setOpen(false);
  }

  function clear() {
    setDraft([min, max]);
    setFromInput(String(min));
    setToInput(String(max));
    setError("");
    if (applied.length) {
      onApply([]);
      setOpen(false);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setError(""); }}>
      <Popover.Trigger asChild>
        <button
          aria-label={`Lọc ${label}`}
          className={`${chipClassName} ${applied.length ? "border-primary bg-primary/5 text-primary" : "border-[#eadfd8] text-foreground"}`}
          disabled={isPending}
          type="button"
        >
          <span className="max-w-52 truncate">{label}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="z-50 w-[min(350px,calc(100vw-1.5rem))] rounded-xl border border-[#eadfd8] bg-background text-foreground shadow-xl outline-none"
          collisionPadding={12}
          sideOffset={8}
        >
          <div className="space-y-4 p-4">
            <h3 className="text-sm font-semibold">{label}</h3>
            <div className="flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
              <span>{format(min)}</span>
              <Slider.Root
                aria-label={label}
                className="relative flex h-5 min-w-0 flex-1 touch-none select-none items-center"
                disabled={isPending}
                max={max}
                min={min}
                onValueChange={(next) => {
                  setDraft(next);
                  setFromInput(String(next[0]));
                  setToInput(String(next[1]));
                  setError("");
                }}
                step={step}
                value={draft}
              >
                <Slider.Track className="relative h-1.5 grow rounded-full bg-[#f0e8e2]">
                  <Slider.Range className="absolute h-full rounded-full bg-primary" />
                </Slider.Track>
                <Slider.Thumb aria-label={`${label} từ`} className="block size-5 cursor-grab rounded-full border-2 border-primary bg-background shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:cursor-grabbing" />
                <Slider.Thumb aria-label={`${label} đến`} className="block size-5 cursor-grab rounded-full border-2 border-primary bg-background shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:cursor-grabbing" />
              </Slider.Root>
              <span className="whitespace-nowrap">{format(max)}{field.max == null ? "+" : ""}{field.unit ? ` ${field.unit}` : ""}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <label className="relative min-w-0">
                <span className="mb-1 block text-[11px] text-muted-foreground">Từ</span>
                <input
                  aria-label={`${label} từ`}
                  className="h-10 w-full rounded-lg border border-[#eadfd8] bg-background px-3 pr-8 text-xs outline-none focus:border-primary"
                  disabled={isPending}
                  inputMode="decimal"
                  onChange={(event) => {
                    updateGroupedNumberInput(event.currentTarget, fromInput, setFromInput);
                    setError("");
                  }}
                  onKeyDown={(event) => handleGroupedNumberKeyDown(event, fromInput, setFromInput)}
                  placeholder="Từ"
                  type="text"
                  value={formatMoneyInput(fromInput)}
                />
                {field.unit ? <span className="pointer-events-none absolute bottom-3 right-2 text-[10px] text-muted-foreground">{field.unit}</span> : null}
              </label>
              <span className="text-muted-foreground">–</span>
              <label className="relative min-w-0">
                <span className="mb-1 block text-[11px] text-muted-foreground">Đến</span>
                <input
                  aria-label={`${label} đến`}
                  className="h-10 w-full rounded-lg border border-[#eadfd8] bg-background px-3 pr-8 text-xs outline-none focus:border-primary"
                  disabled={isPending}
                  inputMode="decimal"
                  onChange={(event) => {
                    updateGroupedNumberInput(event.currentTarget, toInput, setToInput);
                    setError("");
                  }}
                  onKeyDown={(event) => handleGroupedNumberKeyDown(event, toInput, setToInput)}
                  placeholder="Đến"
                  type="text"
                  value={formatMoneyInput(toInput)}
                />
                {field.unit ? <span className="pointer-events-none absolute bottom-3 right-2 text-[10px] text-muted-foreground">{field.unit}</span> : null}
              </label>
            </div>
            {error ? <p className="text-xs text-error" role="alert">{error}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-[#f0e8e2] p-3">
            <button
              className="h-9 cursor-pointer rounded-lg border border-[#eadfd8] text-xs font-semibold transition-colors hover:bg-[#fff4ed] disabled:opacity-50"
              disabled={isPending || (!applied.length && !hasDraftSelection)}
              onClick={clear}
              type="button"
            >
              Xóa lọc
            </button>
            <button
              className="h-9 cursor-pointer rounded-lg bg-primary text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending || (!hasDraftSelection && !applied.length)}
              onClick={apply}
              type="button"
            >
              Áp dụng
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function FreeformSpecificationFilter({
  applied,
  field,
  isPending,
  label,
  onApply,
}: {
  applied: PublicEquipmentListingSpecFilter[];
  field: CatalogSpecField;
  isPending: boolean;
  label: string;
  onApply: (next: PublicEquipmentListingSpecFilter[]) => void;
}) {
  const exact = applied.find((filter) => filter.operator === "eq")?.value;
  const [value, setValue] = useState(String(exact ?? ""));

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fieldKey = field.key!;
    onApply(value.trim() ? [{ field: fieldKey, operator: "eq", value: value.trim() }] : []);
  }

  return (
    <form className="flex w-full flex-wrap items-center gap-2" onSubmit={apply}>
      <span className="mr-1 text-xs text-muted-foreground">{label}:</span>
      <input aria-label={label} className={`${inputClassName} w-40 sm:w-48`} disabled={isPending} onChange={(event) => setValue(event.target.value)} placeholder="Nhập giá trị" type="text" value={value} />
      <button className={`${chipClassName} border-primary text-primary hover:bg-primary/5`} disabled={isPending} type="submit">Áp dụng</button>
    </form>
  );
}
