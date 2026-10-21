"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, MapPin, Search, X } from "lucide-react";

import { SearchableSelectField } from "@/components/forms/searchable-select-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ALL_PUBLIC_AREAS,
  getPublicAreaLabel,
  PUBLIC_FEATURED_PROVINCES,
  type PublicAreaSelection,
} from "@/lib/locations/public-area";
import { VIETNAM_PROVINCES } from "@/lib/locations/vietnam-divisions";
import { usePublicArea } from "@/providers/public-area-provider";
import { cn } from "@/utils/cn";

function normalizeSearch(value: string) {
  return value
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export function PublicAreaSelector() {
  const {
    area,
    isReady,
    selectArea,
    isPickerOpen,
    openPicker,
    closePicker,
  } = usePublicArea();
  const label = getPublicAreaLabel(area);

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={`Khu vực: ${label}`}
        className="inline-flex max-w-40 shrink-0 cursor-pointer items-center gap-1.5 bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4"
        onClick={openPicker}
        title={label}
        type="button"
      >
        <MapPin aria-hidden="true" className="size-4 shrink-0" />
        <span className="hidden truncate sm:block">
          {label.replace(/^(Tỉnh|Thành phố) /, "")}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="hidden size-3 shrink-0 sm:block"
        />
      </button>
      {/* Restore the saved area before initializing the dialog's draft. */}
      {isPickerOpen && isReady ? (
        <AreaDialog
          initialArea={area}
          onClose={closePicker}
          onConfirm={(next) => {
            selectArea(next);
            closePicker();
          }}
        />
      ) : null}
    </>
  );
}

function AreaDialog({
  initialArea,
  onClose,
  onConfirm,
}: {
  initialArea: PublicAreaSelection | null;
  onClose: () => void;
  onConfirm: (area: PublicAreaSelection) => void;
}) {
  const [draft, setDraft] = useState(initialArea ?? ALL_PUBLIC_AREAS);
  const [query, setQuery] = useState("");
  const province = VIETNAM_PROVINCES.find(
    (item) => item.code === draft?.provinceCode,
  );
  const searchTokens = normalizeSearch(query)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const provinceOptions = [
    { code: "", name: "Toàn quốc" },
    ...VIETNAM_PROVINCES.filter(
      (item) =>
        query.trim() ||
        !PUBLIC_FEATURED_PROVINCES.some((popular) => popular.code === item.code),
    ),
  ].filter((item) =>
    searchTokens.every((token) => normalizeSearch(item.name).includes(token)),
  );
  const wardOptions = [
    { value: "", label: "Tất cả phường / xã" },
    ...(province?.wards.map((ward) => ({
      value: ward.code,
      label: ward.name,
    })) ?? []),
  ];

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="flex max-h-[calc(100dvh-2rem)] max-w-[480px] flex-col gap-5 overflow-y-auto rounded-lg p-4 text-foreground"
        showCloseButton={false}
      >
        <button
          aria-label="Đóng"
          className="absolute left-4 top-4 cursor-pointer rounded p-1 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
        <DialogHeader className="shrink-0 items-center pb-0 pt-12 text-center">
          <DialogTitle className="text-base font-semibold">
            Chọn khu vực bạn đang tìm kiếm
          </DialogTitle>
          <DialogDescription className="sr-only">
            Chọn tỉnh / thành phố để tìm thiết bị theo khu vực kho.
          </DialogDescription>
        </DialogHeader>
        <div
          aria-label="Tỉnh / thành phố phổ biến"
          className="grid shrink-0 grid-cols-3 gap-5 px-2 sm:gap-8 sm:px-3"
          role="group"
        >
          {PUBLIC_FEATURED_PROVINCES.map((item) => (
            <button
              aria-pressed={draft?.provinceCode === item.code}
              className={cn(
                "group flex min-w-0 cursor-pointer flex-col items-center gap-4 rounded text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:text-base",
                draft?.provinceCode === item.code && "text-primary",
              )}
              key={item.code}
              onClick={() =>
                setDraft({ provinceCode: item.code, wardCode: "" })
              }
              type="button"
            >
              <span
                className={cn(
                  "relative block aspect-[4/3] w-full overflow-hidden rounded-lg ring-primary group-hover:ring-2",
                  draft?.provinceCode === item.code && "ring-2",
                )}
              >
                <Image
                  alt=""
                  className="object-cover"
                  fill
                  sizes="(max-width: 480px) 26vw, 114px"
                  src={item.image}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute right-1 top-1 flex size-5 items-center justify-center rounded-full border-2 border-[#d9d9d9] bg-white",
                    draft?.provinceCode === item.code && "border-primary",
                  )}
                >
                  {draft?.provinceCode === item.code ? (
                    <span className="size-2.5 rounded-full bg-primary" />
                  ) : null}
                </span>
              </span>
              {item.label}
            </button>
          ))}
        </div>
        <label className="flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#f5f5f5] px-3 text-muted-foreground">
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <span className="sr-only">Tìm tỉnh thành</span>
          <input
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tỉnh thành..."
            type="search"
            value={query}
          />
        </label>
        <div
          aria-label="Tỉnh / Thành phố"
          className="max-h-52 min-h-24 overflow-y-auto overscroll-contain"
          role="group"
        >
          {provinceOptions.length ? (
            provinceOptions.map((item) => (
              <label
                className="flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded px-4 py-2 text-sm hover:bg-primary/5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary sm:text-base"
                key={item.code}
              >
                <span>{item.name.replace(/^(Tỉnh|Thành phố) /, "")}</span>
                <input
                  aria-label={item.name}
                  checked={draft?.provinceCode === item.code}
                  className="size-5 shrink-0 cursor-pointer appearance-none rounded-full border-2 border-[#d9d9d9] bg-white checked:border-primary checked:bg-primary checked:shadow-[inset_0_0_0_3px_white] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  name="public-area-province"
                  onChange={() =>
                    setDraft(
                      item.code
                        ? { provinceCode: item.code, wardCode: "" }
                        : ALL_PUBLIC_AREAS,
                    )
                  }
                  type="radio"
                  value={item.code}
                />
              </label>
            ))
          ) : (
            <p
              className="px-4 py-8 text-center text-sm text-muted-foreground"
              role="status"
            >
              Không tìm thấy tỉnh / thành phố.
            </p>
          )}
        </div>
        {province ? (
          <SearchableSelectField
            id="public-area-ward"
            label="Phường / Xã "
            onChange={(wardCode) => {
              if (draft) setDraft({ ...draft, wardCode });
            }}
            options={wardOptions}
            placeholder="Tất cả phường / xã"
            value={draft?.wardCode ?? ""}
          />
        ) : null}
        <Button
          className="w-full shrink-0 rounded-lg"
          disabled={!draft}
          onClick={() => {
            if (draft) onConfirm(draft);
          }}
          type="button"
        >
          Xác nhận
        </Button>
      </DialogContent>
    </Dialog>
  );
}
