"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ProductRefreshButton } from "./product-refresh-button";

type FilterOption = { id: string; name: string };

function searchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLocaleLowerCase("vi")
    .trim();
}

export function ProductFilterSection({
  title,
  name,
  options,
  value,
  allLabel,
  placeholder,
  emptyMessage,
  errorMessage,
  disabled,
  onChange,
  defaultExpanded = false,
}: {
  title: string;
  name: string;
  options: FilterOption[] | null;
  value?: string;
  allLabel?: string;
  placeholder: string;
  emptyMessage: string;
  errorMessage: string;
  disabled: boolean;
  onChange: (id: string | undefined) => void;
  defaultExpanded?: boolean;
}) {
  const [keyword, setKeyword] = useState("");
  const query = searchText(keyword);
  const matches = options?.filter((option) =>
    searchText(option.name).includes(query),
  );
  const choices = [
    ...(allLabel ? [{ id: "", name: allLabel }] : []),
    ...(matches ?? []),
  ];
  const selectedLabel = options?.find((option) => option.id === value)?.name;
  return (
    <details className="min-w-0" open={defaultExpanded}>
      <summary className="cursor-pointer text-[11px] font-bold uppercase">
        {title}
        {selectedLabel ? <span className="mt-1 block truncate text-xs font-normal normal-case text-primary">{selectedLabel}</span> : null}
      </summary>
      <fieldset className="mt-3 min-w-0" disabled={disabled}>
      <legend className="sr-only">{title}</legend>
      {options ? (
        <>
          <div className="relative mb-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={placeholder}
              className="h-8 pl-8 text-xs md:text-xs"
              onChange={(event) => setKeyword(event.target.value)}
              placeholder={placeholder}
              type="search"
              value={keyword}
            />
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {choices.map((option) => (
              <label
                className={`flex cursor-pointer items-start gap-2 rounded px-1 py-1.5 text-xs leading-4 ${(value ?? "") === option.id ? "font-semibold text-primary" : "hover:text-primary"}`}
                key={option.id}
              >
                <input
                  checked={(value ?? "") === option.id}
                  className="mt-0.5 size-3.5 shrink-0 cursor-pointer accent-primary"
                  name={name}
                  onChange={() => onChange(option.id || undefined)}
                  type="radio"
                  value={option.id}
                />
                {option.name}
              </label>
            ))}
            {!matches?.length ? (
              <p className="px-1 py-2 text-xs text-muted-foreground" role="status">
                {query ? "Không tìm thấy kết quả." : emptyMessage}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-error">{errorMessage}</p>
          <ProductRefreshButton />
        </div>
      )}
      </fieldset>
    </details>
  );
}
