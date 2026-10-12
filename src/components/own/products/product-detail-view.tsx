"use client";

import { Pencil, RefreshCw } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DetailPageHeader,
  DetailTabs,
  StatisticCards,
} from "@/components/layout/detail-page";
import { ResourcePanel } from "@/components/layout/resource-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiResource } from "@/hooks/use-api-resource";
import type { ApiResult } from "@/services/api-error";
import type {
  InventoryAsset,
  UpdateEquipmentListingRequest,
  EquipmentListingRentalRate,
} from "@/types/inventory";
import {
  getEquipmentListingName,
  getEquipmentListingStatusLabel,
  getEquipmentListingStatusVariant,
} from "@/utils/inventory";
import { ProductEditDrawer } from "./product-detail-drawer";
import { ProductAssetsTable } from "./product-assets-table";
import { ProductAssetDrawer } from "./product-asset-drawer";
import { ProductCalendarPanel } from "./product-calendar-panel";
import { ProductInformationPanel } from "./product-information-panel";
import type {
  ProductDetailInitialData,
  ProductPageActions,
} from "./product-management-types";

export function ProductDetailView({
  productId,
  actions,
  initialProduct,
  initialBrand,
  initialType,
  initialCalendar,
  initialToday: today,
}: {
  productId: string;
  actions: ProductPageActions;
} & ProductDetailInitialData) {
  const [activeTab, setActiveTab] = useState("assets");
  const [visitedTabs, setVisitedTabs] = useState(["assets"]);
  const [editTab, setEditTab] = useState<string | null>(null);
  const [assetDrawer, setAssetDrawer] = useState<{
    mode: "create" | "view" | "edit";
    asset: InventoryAsset | null;
  } | null>(null);
  const [revision, setRevision] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const submittingRef = useRef(false);
  const requestProduct = useCallback(
    () => actions.fetch(productId),
    [actions, productId],
  );
  const product = useApiResource(requestProduct, true, initialProduct);
  const data = product.data;
  const requestToday = useCallback(
    () => actions.fetchCalendar(productId, { from: today, to: today }),
    [actions, productId, today],
  );
  const todayCalendar = useApiResource(requestToday, true, initialCalendar);
  const requestBrand = useCallback(
    () => actions.fetchBrand(data?.brandId ?? ""),
    [actions, data?.brandId],
  );
  const brand = useApiResource(requestBrand, Boolean(data), initialBrand);
  const requestType = useCallback(
    () => actions.fetchEquipmentType(data?.equipmentTypeId ?? ""),
    [actions, data?.equipmentTypeId],
  );
  const type = useApiResource(requestType, Boolean(data), initialType);
  const todayStats = todayCalendar.data?.days?.find(
    (day) => day.date === today,
  );

  async function save<T>(
    operation: () => Promise<ApiResult<T>>,
    apply: (result: T) => void,
    message: string,
  ) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSaving(true);
    try {
      const result = await operation();
      if (result.success) {
        apply(result.data);
        toast.success(message);
      } else toast.error(result.error.message);
      return result;
    } finally {
      submittingRef.current = false;
      setIsSaving(false);
    }
  }
  function updateInformation(request: UpdateEquipmentListingRequest) {
    return save(
      () => actions.updateInformation(productId, request),
      product.setData,
      request.specValues
        ? "Đã cập nhật thông số kỹ thuật."
        : "Đã cập nhật thông tin sản phẩm.",
    );
  }
  function updateRate(request: EquipmentListingRentalRate) {
    return save(
      () => actions.updateRentalRate(productId, request),
      (rate) =>
        product.setData((current) =>
          current ? { ...current, rentalRate: rate } : current,
        ),
      "Đã cập nhật giá thuê.",
    );
  }
  function onAssetChanged() {
    setRevision((value) => value + 1);
    void product.refresh();
    void todayCalendar.refresh();
  }

  return (
    <div className="h-full min-h-0 min-w-0 overflow-hidden p-4 md:p-6">
      <ResourcePanel
        error={!data ? product.error : null}
        isLoading={product.isLoading && !data}
        onRetry={() => void product.refresh()}
      >
        {data ? (
          <div className="mx-auto flex h-full min-h-0 max-w-[1800px] flex-col gap-5">
            <div className="max-h-[30%] shrink-0 space-y-5 overflow-y-auto md:max-h-[45%]">
              <DetailPageHeader
                actions={
                  <>
                    <Button
                      disabled={isSaving}
                      onClick={() => setEditTab("information")}
                      type="button"
                      variant="secondary"
                    >
                      <Pencil className="size-4" />
                      Sửa sản phẩm
                    </Button>
                  </>
                }
                backHref="/own/products"
                backLabel="Danh sách sản phẩm"
                description={
                  <>
                    {!type.data && !type.error ? (
                      <Skeleton
                        aria-label="Đang tải loại thiết bị"
                        className="h-4 w-32"
                        role="status"
                      />
                    ) : (
                      <span>{type.data?.name || "—"}</span>
                    )}
                    {!brand.data && !brand.error ? (
                      <Skeleton
                        aria-label="Đang tải thương hiệu"
                        className="h-4 w-20"
                        role="status"
                      />
                    ) : (
                      <span>{brand.data?.name || "—"}</span>
                    )}
                  </>
                }
                imageUrl={data.thumbnailUrl}
                status={
                  <Badge
                    variant={getEquipmentListingStatusVariant(data.status)}
                  >
                    {getEquipmentListingStatusLabel(data.status)}
                  </Badge>
                }
                title={getEquipmentListingName(data)}
              />
              <StatisticCards
                items={[
                  {
                    label: "Tổng máy vật lý",
                    value: data.totalQuantity,
                    description: "Mỗi máy có số serial riêng",
                  },
                  {
                    label: "Đang sử dụng hôm nay",
                    value: todayCalendar.error
                      ? "—"
                      : todayStats?.occupiedQuantity,
                    description: "Bao gồm lịch thuê và giữ chỗ",
                    tone: "accent",
                    isLoading: todayCalendar.isLoading,
                  },
                  {
                    label: "Bị chặn lịch hôm nay",
                    value: todayCalendar.error
                      ? "—"
                      : todayStats?.blockedQuantity,
                    description: "Máy bị chặn không thể đặt thuê",
                    tone: "warning",
                    isLoading: todayCalendar.isLoading,
                  },
                  {
                    label: "Khả dụng hôm nay",
                    value: todayCalendar.error
                      ? "—"
                      : todayStats?.availableQuantity,
                    description: "Theo lịch sử dụng của sản phẩm",
                    tone: "success",
                    isLoading: todayCalendar.isLoading,
                  },
                ]}
              />
              {product.error && data ? (
                <div
                  className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                  role="alert"
                >
                  <span>
                    Chưa cập nhật được thông tin sản phẩm: {product.error}
                  </span>
                  <Button
                    onClick={() => void product.refresh()}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Thử lại
                  </Button>
                </div>
              ) : null}
              {todayCalendar.error ? (
                <div
                  className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                  role="alert"
                >
                  <span>
                    Chưa tải được thống kê hôm nay: {todayCalendar.error}
                  </span>
                  <Button
                    onClick={() => void todayCalendar.refresh()}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <RefreshCw className="size-3" />
                    Thử lại
                  </Button>
                </div>
              ) : null}
            </div>
            <DetailTabs
              fill
              items={[
                {
                  value: "assets",
                  scrollable: false,
                  label: "Máy vật lý",
                  content: (
                    <ProductAssetsTable
                      fetchAssets={actions.fetchAssets}
                      onCreate={() =>
                        setAssetDrawer({ mode: "create", asset: null })
                      }
                      onView={(asset, mode) => setAssetDrawer({ mode, asset })}
                      productId={productId}
                      revision={revision}
                    />
                  ),
                },
                {
                  value: "calendar",
                  label: "Lịch sử dụng",
                  content: visitedTabs.includes("calendar") ? (
                    <ProductCalendarPanel
                      fetchCalendar={actions.fetchCalendar}
                      productId={productId}
                      revision={revision}
                    />
                  ) : null,
                },
                {
                  value: "information",
                  label: "Thông tin sản phẩm",
                  content: visitedTabs.includes("information") ? (
                    <ProductInformationPanel
                      brandName={brand.data?.name}
                      fetchSchema={actions.fetchSchemaVersion}
                      onEdit={setEditTab}
                      product={data}
                      typeName={type.data?.name}
                    />
                  ) : null,
                },
              ]}
              onValueChange={(tab) => {
                setActiveTab(tab);
                setVisitedTabs((tabs) =>
                  tabs.includes(tab) ? tabs : [...tabs, tab],
                );
              }}
              value={activeTab}
            />
            {editTab ? (
              <ProductEditDrawer
                actions={actions}
                brandName={brand.data?.name}
                error={null}
                fetchBrands={actions.fetchBrands}
                initialTab={editTab}
                isLoading={false}
                isSubmitting={isSaving}
                onOpenChange={(open) => {
                  if (!open) setEditTab(null);
                }}
                onUpdateInformation={updateInformation}
                onUpdateRentalRate={updateRate}
                product={data}
                selectedName={getEquipmentListingName(data)}
                typeName={type.data?.name}
              />
            ) : null}
            {assetDrawer ? (
              <ProductAssetDrawer
                actions={actions}
                initialMode={assetDrawer.mode}
                onChanged={onAssetChanged}
                onClose={() => setAssetDrawer(null)}
                productId={productId}
                productName={getEquipmentListingName(data)}
                selectedAsset={assetDrawer.asset}
              />
            ) : null}
          </div>
        ) : null}
      </ResourcePanel>
    </div>
  );
}
