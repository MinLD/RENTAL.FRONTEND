"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Search } from "lucide-react";

import { ProductImage } from "@/components/products/product-image";
import { Skeleton } from "@/components/ui/skeleton";
import { EQUIPMENT_SEARCH_MIN_LENGTH } from "@/config/equipment-search";
import { productBrowseHref } from "@/config/product-browse";
import { useEquipmentSearch } from "@/hooks/use-equipment-search";
import { getEquipmentListingName } from "@/utils/inventory";

export function EquipmentSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const id = useId();
  const listId = `${id}-suggestions`;
  const search = useEquipmentSearch(keyword, isOpen);
  const trimmedKeyword = keyword.trim();
  const showPanel = isOpen && Boolean(trimmedKeyword);
  const activeSuggestion = search.suggestions[activeIndex];

  function close() {
    setIsOpen(false);
    setActiveIndex(-1);
  }

  useEffect(() => {
    if (!isOpen) return;
    function handleOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !ref.current?.contains(event.target)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () =>
      document.removeEventListener("pointerdown", handleOutsideClick);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeIndex, isOpen]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    close();
    router.push(productBrowseHref({ q: trimmedKeyword || undefined }));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!trimmedKeyword) return;
      event.preventDefault();
      setIsOpen(true);
      const count = search.suggestions.length;
      if (!count) return;
      setActiveIndex((current) =>
        event.key === "ArrowDown"
          ? (current + 1) % count
          : current < 0
            ? count - 1
            : (current - 1 + count) % count,
      );
    } else if (event.key === "Enter" && showPanel && activeSuggestion) {
      event.preventDefault();
      close();
      router.push(`/products/${encodeURIComponent(activeSuggestion.id)}`);
    }
  }

  return (
    <div
      className="relative min-w-0 flex-1"
      ref={ref}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
    >
      <form
        action="/products"
        aria-label="Tìm kiếm thiết bị"
        className="flex h-9 min-w-0 overflow-hidden rounded border border-primary"
        method="get"
        onSubmit={submit}
      >
        <label className="sr-only" htmlFor={id}>
          Tìm kiếm thiết bị
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3 text-muted-foreground focus-within:text-primary">
          <Search aria-hidden="true" className="size-4 shrink-0" />
          <input
            aria-activedescendant={
              showPanel && activeSuggestion
                ? `${id}-option-${activeIndex}`
                : undefined
            }
            aria-autocomplete="list"
            aria-controls={showPanel ? listId : undefined}
            aria-expanded={showPanel}
            aria-haspopup="listbox"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:text-sm"
            id={id}
            maxLength={200}
            name="q"
            onChange={(event) => {
              setKeyword(event.target.value);
              setActiveIndex(-1);
              setIsOpen(Boolean(event.target.value.trim()));
            }}
            onFocus={() => setIsOpen(Boolean(trimmedKeyword))}
            onKeyDown={handleKeyDown}
            placeholder="Bạn cần thuê thiết bị gì?"
            role="combobox"
            type="search"
            value={keyword}
          />
        </div>
        <button
          aria-label="Tìm máy"
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4"
          type="submit"
        >
          <span className="hidden sm:inline">Tìm máy</span>
          <Search aria-hidden="true" className="size-3.5" />
        </button>
      </form>
      {showPanel ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg border border-border bg-background shadow-lg">
          <div className="px-3.5 py-2.5 text-xs font-semibold">
            Gợi ý thiết bị
          </div>
          {!search.canSearch ? (
            <p
              className="px-3.5 pb-3 text-xs text-muted-foreground"
              role="status"
            >
              Nhập ít nhất {EQUIPMENT_SEARCH_MIN_LENGTH} ký tự để tìm thiết bị.
            </p>
          ) : search.isLoadingSuggestions ? (
            <div
              aria-label="Đang tìm thiết bị"
              className="space-y-3 px-3.5 pb-3"
              role="status"
            >
              {Array.from({ length: 3 }, (_, index) => (
                <div className="flex items-center gap-3" key={index}>
                  <Skeleton className="size-12 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : search.isError ? (
            <div className="space-y-2 px-3.5 pb-3 text-xs" role="alert">
              <p className="text-muted-foreground">
                Không thể tải gợi ý thiết bị.
              </p>
              <button
                className="cursor-pointer font-semibold text-primary"
                onClick={() => void search.refetch()}
                type="button"
              >
                Thử lại
              </button>
            </div>
          ) : !search.suggestions.length ? (
            <p
              className="px-3.5 pb-3 text-xs text-muted-foreground"
              role="status"
            >
              Không tìm thấy thiết bị phù hợp.
            </p>
          ) : null}
          <ul
            aria-label="Gợi ý thiết bị"
            className="max-h-[min(22rem,calc(100dvh-14rem))] overflow-y-auto"
            id={listId}
            role="listbox"
          >
            {search.suggestions.map((product, index) => {
              const name = getEquipmentListingName(product);
              const src =
                product.thumbnailUrl ||
                product.media?.find((media) => media.url)?.url;
              return (
                <li key={product.id} role="presentation">
                  <Link
                    aria-label={name}
                    aria-selected={index === activeIndex}
                    className={`flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-primary/5 ${index === activeIndex ? "bg-primary/5" : ""}`}
                    href={`/products/${encodeURIComponent(product.id)}`}
                    id={`${id}-option-${index}`}
                    onClick={close}
                    onPointerEnter={() => setActiveIndex(index)}
                    prefetch={false}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    role="option"
                    tabIndex={-1}
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded border border-border">
                      <ProductImage
                        compact
                        imageClassName="object-contain"
                        name={name}
                        sizes="48px"
                        src={src}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      {product.model ? (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          Model: {product.model}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          {search.canSearch ? (
            <Link
              className="block truncate border-t border-border px-3.5 py-3 text-xs font-semibold text-primary hover:bg-primary/5"
              href={productBrowseHref({ q: trimmedKeyword })}
              onClick={close}
              prefetch={false}
            >
              Xem tất cả kết quả cho “{trimmedKeyword}”
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
