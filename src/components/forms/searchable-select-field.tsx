"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { Popover } from "radix-ui";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

export type SelectOption = { label: string; value: string };

type SearchableSelectFieldProps = {
  disabled?: boolean;
  error?: string;
  id?: string;
  label: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  required?: boolean;
  value: string;
};

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export const SearchableSelectField = forwardRef<
  HTMLButtonElement,
  SearchableSelectFieldProps
>(
  (
    {
      disabled = false,
      error,
      id,
      label,
      onBlur,
      onChange,
      options,
      placeholder = "Chọn một mục",
      required,
      value,
    },
    ref,
  ) => {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const listId = `${fieldId}-options`;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const searchRef = useRef<HTMLInputElement>(null);
    const selectedOption = options.find((option) => option.value === value);
    const indexedOptions = useMemo(
      () => options.map((option) => ({
        ...option,
        searchText: normalizeSearch(option.label),
      })),
      [options],
    );
    const tokens = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
    const filtered = indexedOptions.filter((option) =>
      tokens.every((token) => option.searchText.includes(token)),
    );

    useEffect(() => {
      if (open) {
        document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({
          block: "nearest",
        });
      }
    }, [activeIndex, listId, open]);

    function handleOpenChange(nextOpen: boolean) {
      setOpen(nextOpen);
      if (nextOpen) {
        setQuery("");
        setActiveIndex(Math.max(
          0,
          options.findIndex((option) => option.value === value),
        ));
      } else {
        onBlur?.();
      }
    }

    function selectOption(option: SelectOption) {
      onChange(option.value);
      handleOpenChange(false);
    }

    return (
      <div className="min-w-0 space-y-1.5">
        <label
          className="block text-xs font-semibold uppercase text-foreground"
          htmlFor={fieldId}
        >
          {label}
          {required ? <span className="ml-1 text-error">*</span> : null}
        </label>
        <Popover.Root onOpenChange={handleOpenChange} open={open}>
          <Popover.Trigger asChild>
            <button
              aria-controls={open ? listId : undefined}
              aria-describedby={error ? `${fieldId}-error` : undefined}
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-invalid={Boolean(error)}
              aria-required={required}
              className={cn(
                "flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded border border-input bg-background px-3 text-left text-base text-foreground outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60 md:text-sm",
                !selectedOption && "text-muted-foreground",
                error && "border-error",
              )}
              disabled={disabled}
              id={fieldId}
              onBlur={() => {
                if (!open) onBlur?.();
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  handleOpenChange(true);
                }
              }}
              ref={ref}
              role="combobox"
              type="button"
            >
              <span className="truncate">{selectedOption?.label ?? placeholder}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              aria-label={`Chọn ${label.toLocaleLowerCase("vi")}`}
              className="z-50 w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-background shadow-lg"
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                searchRef.current?.focus();
              }}
              sideOffset={5}
            >
              <div className="relative border-b border-border p-2">
                <Search
                  aria-hidden="true"
                  className="absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-activedescendant={
                    filtered[activeIndex] ? `${listId}-${activeIndex}` : undefined
                  }
                  aria-autocomplete="list"
                  aria-controls={listId}
                  aria-expanded={open}
                  aria-label={`Tìm ${label.toLocaleLowerCase("vi")}`}
                  autoComplete="off"
                  className="pl-9"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (["ArrowDown", "ArrowUp", "Enter", "Home", "End"].includes(event.key)) {
                      event.preventDefault();
                    }
                    if (event.key === "ArrowDown") {
                      setActiveIndex((index) => Math.max(0, Math.min(index + 1, filtered.length - 1)));
                    }
                    if (event.key === "ArrowUp") {
                      setActiveIndex((index) => Math.max(0, index - 1));
                    }
                    if (event.key === "Home") setActiveIndex(0);
                    if (event.key === "End") {
                      setActiveIndex(Math.max(0, filtered.length - 1));
                    }
                    if (event.key === "Enter" && filtered[activeIndex]) {
                      selectOption(filtered[activeIndex]);
                    }
                  }}
                  placeholder="Nhập để tìm kiếm..."
                  ref={searchRef}
                  role="combobox"
                  value={query}
                />
              </div>
              <div
                aria-label={label}
                className="max-h-[min(16rem,var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain p-1"
                id={listId}
                role="listbox"
              >
                {filtered.length ? filtered.map((option, index) => (
                  <button
                    aria-selected={option.value === value}
                    className={cn(
                      "flex w-full cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm text-foreground hover:bg-hover-accent hover:text-hover-accent-foreground",
                      index === activeIndex && "bg-hover-accent text-hover-accent-foreground",
                    )}
                    id={`${listId}-${index}`}
                    key={option.value}
                    onClick={() => selectOption(option)}
                    onPointerMove={() => setActiveIndex(index)}
                    role="option"
                    tabIndex={-1}
                    type="button"
                  >
                    <span>{option.label}</span>
                    {option.value === value ? (
                      <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
                    ) : null}
                  </button>
                )) : (
                  <div className="px-3 py-5 text-center text-sm text-muted-foreground" role="status">
                    Không tìm thấy kết quả.
                  </div>
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        {error ? (
          <p className="text-xs font-medium text-error" id={`${fieldId}-error`}>
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

SearchableSelectField.displayName = "SearchableSelectField";
