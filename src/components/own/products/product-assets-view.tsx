"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { AvatarWithSkeleton } from "@/components/ui/avatar-with-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import type { ApiResult } from "@/services/api-error";
import type {
  DataTableFetchParams,
  DataTableFetchResult,
} from "@/types/data-table";
import type { EquipmentListing, InventoryAsset } from "@/types/inventory";
import {
  formatEquipmentListingDate,
  getEquipmentListingName,
} from "@/utils/inventory";
import { ProductAssetDrawer } from "./product-asset-drawer";
import type { ProductPageActions } from "./product-management-types";

type ProductAssetsFilterParams = {
  productId?: string;
  acceptingBookings?: boolean;
};

type ProductAssetsViewProps = {
  actions: ProductPageActions;
  initialProducts: EquipmentListing[];
  fixedProduct?: EquipmentListing;
};

export function ProductAssetsView({
  actions,
  initialProducts,
  fixedProduct,
}: ProductAssetsViewProps) {
  const searchParams = useSearchParams();
  const queryProductId = searchParams.get("productId") ?? "";

  const [revision, setRevision] = useState(0);
  const [activeAsset, setActiveAsset] = useState<InventoryAsset | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "view" | "edit">("view");
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState(false);
  const [createForProductId, setCreateForProductId] = useState<string>(
    fixedProduct?.id ?? "",
  );
  const [currentFilterProductId, setCurrentFilterProductId] = useState<string>(
    fixedProduct
      ? fixedProduct.id
      : queryProductId && initialProducts.some((p) => p.id === queryProductId)
        ? queryProductId
        : "",
  );
  const [isPickProductOpen, setIsPickProductOpen] = useState(false);
  const [selectedProductForCreate, setSelectedProductForCreate] = useState<string>(
    initialProducts[0]?.id ?? "",
  );

  const tableRefreshRef = useRef<(() => void) | null>(null);

  const productMap = useMemo(
    () => new Map(initialProducts.map((p) => [p.id, p])),
    [initialProducts],
  );

  const columns: DataTableColumn<InventoryAsset>[] = useMemo(
    () => [
      {
        cell: (asset) => {
          const prod = productMap.get(asset.equipmentListingId);
          const name = prod ? getEquipmentListingName(prod) : "—";
          return (
            <div className="flex min-w-0 items-center gap-3">
              <AvatarWithSkeleton
                alt={name}
                className="size-10 shrink-0 rounded border border-border"
                fallback={name.slice(0, 2).toUpperCase() || "SP"}
                fallbackClassName="rounded bg-muted text-xs font-bold text-foreground"
                imageClassName="rounded object-contain"
                loading="lazy"
                src={prod?.thumbnailUrl}
              />
              <div className="min-w-0">
                <span
                  className="block truncate font-semibold text-foreground"
                  title={name}
                >
                  {name}
                </span>
                {prod?.model ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    Model: {prod.model}
                  </span>
                ) : null}
              </div>
            </div>
          );
        },
        header: "Sản phẩm",
        id: "product",
        minWidth: 220,
        width: 280,
      },
      {
        cell: (asset) => (
          <span className="font-mono font-semibold text-foreground">
            {asset.serialNumber || "—"}
          </span>
        ),
        header: "Số serial",
        id: "serialNumber",
        width: 180,
      },
      {
        cell: (asset) => (
          <span className="font-medium tabular-nums">
            {asset.manufactureYear ?? "—"}
          </span>
        ),
        header: "Năm sản xuất",
        id: "manufactureYear",
        width: 140,
      },
      {
        cell: (asset) => (
          <Badge variant={asset.acceptingBookings ? "success" : "warning"}>
            {asset.acceptingBookings ? "Nhận đặt thuê" : "Tạm ngừng nhận"}
          </Badge>
        ),
        header: "Trạng thái nhận khách",
        id: "acceptingBookings",
        width: 180,
      },
      {
        cell: (asset) => (
          <span className="whitespace-nowrap font-medium text-muted-foreground">
            {formatEquipmentListingDate(asset.createdAt)}
          </span>
        ),
        header: "Ngày tạo",
        id: "createdAt",
        width: 170,
      },
      {
        cell: (asset) => (
          <span className="whitespace-nowrap font-medium text-muted-foreground">
            {formatEquipmentListingDate(asset.updatedAt)}
          </span>
        ),
        header: "Cập nhật",
        id: "updatedAt",
        width: 170,
      },
    ],
    [productMap],
  );

  const fetchAssetsData = useCallback(
    async (
      params: DataTableFetchParams<ProductAssetsFilterParams>,
    ): Promise<ApiResult<DataTableFetchResult<InventoryAsset>>> => {
      const filters = params.filters ?? {};
      const targetProductId = filters.productId;

      if (targetProductId) {
        const result = await actions.fetchAssets(targetProductId, params);
        if (!result.success) return result;

        let filtered = result.data.data;
        if (filters.acceptingBookings !== undefined) {
          filtered = filtered.filter(
            (a) => a.acceptingBookings === filters.acceptingBookings,
          );
        }

        return {
          success: true,
          data: {
            data: filtered,
            totalItems:
              filters.acceptingBookings !== undefined
                ? filtered.length
                : result.data.totalItems,
          },
        };
      }

      // If "Tất cả sản phẩm", fetch from all products and combine
      const results = await Promise.all(
        initialProducts.map((p) =>
          actions.fetchAssets(p.id, {
            keyword: params.keyword,
            page: 1,
            pageSize: 100,
          }),
        ),
      );

      let allAssets: InventoryAsset[] = [];
      for (const res of results) {
        if (res.success && Array.isArray(res.data.data)) {
          allAssets.push(...res.data.data);
        }
      }

      if (filters.acceptingBookings !== undefined) {
        allAssets = allAssets.filter(
          (a) => a.acceptingBookings === filters.acceptingBookings,
        );
      }

      if (params.keyword?.trim()) {
        const kw = params.keyword.trim().toLowerCase();
        allAssets = allAssets.filter((a) =>
          a.serialNumber?.toLowerCase().includes(kw),
        );
      }

      const page = params.page || 1;
      const pageSize = params.pageSize || 20;
      const start = (page - 1) * pageSize;
      const paged = allAssets.slice(start, start + pageSize);

      return {
        success: true,
        data: {
          data: paged,
          totalItems: allAssets.length,
        },
      };
    },
    [actions, initialProducts],
  );

  function handleOpenCreate(currentProductId?: string) {
    const targetId = currentProductId || fixedProduct?.id;
    if (targetId) {
      setCreateForProductId(targetId);
      setActiveAsset(null);
      setDrawerMode("create");
      setIsAssetDrawerOpen(true);
      return;
    }

    if (initialProducts.length === 1 && initialProducts[0]) {
      setCreateForProductId(initialProducts[0].id);
      setActiveAsset(null);
      setDrawerMode("create");
      setIsAssetDrawerOpen(true);
      return;
    }

    setIsPickProductOpen(true);
  }

  function handleConfirmPickProduct() {
    if (!selectedProductForCreate) return;
    setIsPickProductOpen(false);
    setCreateForProductId(selectedProductForCreate);
    setActiveAsset(null);
    setDrawerMode("create");
    setIsAssetDrawerOpen(true);
  }

  function handleViewAsset(asset: InventoryAsset) {
    setCreateForProductId(asset.equipmentListingId);
    setActiveAsset(asset);
    setDrawerMode("edit");
    setIsAssetDrawerOpen(true);
  }

  function handleAssetChanged() {
    setRevision((prev) => prev + 1);
    tableRefreshRef.current?.();
  }

  const activeProductName = useMemo(() => {
    const prod = productMap.get(createForProductId);
    return prod ? getEquipmentListingName(prod) : "Máy vật lý";
  }, [createForProductId, productMap]);

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
      <DataTable<InventoryAsset, ProductAssetsFilterParams>
        bodyClassName="min-h-[260px]"
        className="h-full"
        columns={fixedProduct ? columns.filter((col) => col.header !== "Sản phẩm") : columns}
        csvColumns={[
          {
            header: "Sản phẩm",
            value: (asset) => {
              const p = productMap.get(asset.equipmentListingId);
              return p ? getEquipmentListingName(p) : "";
            },
          },
          { header: "Số serial", value: "serialNumber" },
          { header: "Năm sản xuất", value: "manufactureYear" },
          {
            header: "Nhận đặt thuê",
            value: (asset) =>
              asset.acceptingBookings ? "Nhận đặt thuê" : "Tạm ngừng nhận",
          },
          {
            header: "Ngày tạo",
            value: (asset) => formatEquipmentListingDate(asset.createdAt),
          },
          {
            header: "Cập nhật",
            value: (asset) => formatEquipmentListingDate(asset.updatedAt),
          },
        ]}
        csvFilename="danh-sach-may-vat-ly.csv"
        description={
          fixedProduct
            ? `Danh sách máy móc thực tế và số serial của sản phẩm "${getEquipmentListingName(fixedProduct)}"`
            : "Quản lý danh sách máy móc thực tế, số serial và trạng thái nhận khách"
        }
        emptyState="Không có máy vật lý nào phù hợp."
        fetchData={fetchAssetsData}
        fetchDependencies={[revision]}
        getRowId={(asset) => asset.id}
        initialFilterParams={{
          productId: fixedProduct
            ? fixedProduct.id
            : queryProductId && productMap.has(queryProductId)
              ? queryProductId
              : undefined,
        }}
        initialPageSize={20}
        onRowDoubleClick={(asset) => {
          handleViewAsset(asset);
        }}
        pageSizeOptions={[10, 20, 50, 100]}
        renderFilters={({ filters, setFilters }) => (
          <>
            {!fixedProduct ? (
              <select
                aria-label="Lọc theo sản phẩm"
                className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-64"
                onChange={(event) => {
                  const val = event.target.value;
                  setCurrentFilterProductId(val);
                  setFilters({
                    ...filters,
                    productId: val || undefined,
                  });
                }}
                value={filters.productId ?? ""}
              >
                <option value="">Tất cả sản phẩm</option>
                {initialProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {getEquipmentListingName(p)}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              aria-label="Lọc trạng thái nhận khách"
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary sm:w-56"
              onChange={(event) => {
                setFilters({
                  ...filters,
                  acceptingBookings:
                    event.target.value === ""
                      ? undefined
                      : event.target.value === "true",
                });
              }}
              value={
                filters.acceptingBookings === undefined
                  ? ""
                  : String(filters.acceptingBookings)
              }
            >
              <option value="">Tất cả trạng thái nhận khách</option>
              <option value="true">Nhận đặt thuê</option>
              <option value="false">Tạm ngừng nhận khách</option>
            </select>
          </>
        )}
        renderRowActions={(asset) => (
          <Button
            aria-label="Xem chi tiết và sửa máy vật lý"
            onClick={() => {
              handleViewAsset(asset);
            }}
            size="sm"
            title="Xem chi tiết / Sửa máy"
            type="button"
            variant="default"
            >
            Chi tiết
          </Button>
        )}
        renderToolbarActions={({ refresh }) => {
          tableRefreshRef.current = refresh;
          return (
            <Button
              onClick={() => handleOpenCreate(currentFilterProductId || undefined)}
              type="button"
            >
              <Plus className="size-4" />
              Thêm máy vật lý
            </Button>
          );
        }}
        searchDebounceMs={300}
        searchPlaceholder="Tìm kiếm theo số serial..."
        title={fixedProduct ? "Danh sách máy vật lý" : "Danh sách máy vật lý"}
      />

      {/* Product Asset Drawer */}
      {isAssetDrawerOpen && createForProductId ? (
        <ProductAssetDrawer
          actions={actions}
          initialMode={drawerMode}
          onChanged={handleAssetChanged}
          onClose={() => {
            setIsAssetDrawerOpen(false);
            setActiveAsset(null);
          }}
          productId={createForProductId}
          productName={activeProductName}
          selectedAsset={activeAsset}
        />
      ) : null}

      {/* Pick Product Dialog when creating asset without filter */}
      <Dialog onOpenChange={setIsPickProductOpen} open={isPickProductOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn sản phẩm</DialogTitle>
            <DialogDescription>
              Vui lòng chọn sản phẩm bạn muốn thêm máy vật lý (số serial) vào kho.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label
              className="mb-2 block text-xs font-semibold text-foreground"
              htmlFor="pick-product-select"
            >
              Sản phẩm:
            </label>
            <select
              className="h-10 w-full cursor-pointer rounded border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary"
              id="pick-product-select"
              onChange={(e) => setSelectedProductForCreate(e.target.value)}
              value={selectedProductForCreate}
            >
              {initialProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {getEquipmentListingName(p)}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsPickProductOpen(false)}
              type="button"
              variant="secondary"
            >
              Hủy
            </Button>
            <Button
              disabled={!selectedProductForCreate}
              onClick={handleConfirmPickProduct}
              type="button"
            >
              Tiếp tục
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
