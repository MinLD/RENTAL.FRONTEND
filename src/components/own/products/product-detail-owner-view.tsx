"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Cpu,
  Edit,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/products/product-image";
import type { EquipmentListing, EquipmentListingRentalRate, UpdateEquipmentListingRequest } from "@/types/inventory";
import {
  formatEquipmentListingDate,
  formatEquipmentListingRate,
  getEquipmentListingName,
  getEquipmentListingStatusLabel,
} from "@/utils/inventory";
import { ProductAssetsView } from "./product-assets-view";
import { ProductCalendarPanel } from "./product-calendar-panel";
import { ProductEditDrawer } from "./product-detail-drawer";
import type { ProductPageActions } from "./product-management-types";

type ProductDetailOwnerViewProps = {
  actions: ProductPageActions;
  product: EquipmentListing;
  brandName?: string;
  typeName?: string;
};

export function ProductDetailOwnerView({
  actions,
  product: initialProduct,
  brandName,
  typeName,
}: ProductDetailOwnerViewProps) {
  const [product, setProduct] = useState<EquipmentListing>(initialProduct);
  const [activeTab, setActiveTab] = useState<"assets" | "info" | "calendar">("assets");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [calendarRevision] = useState(0);

  const productName = getEquipmentListingName(product);

  const handleUpdateInformation = async (request: UpdateEquipmentListingRequest) => {
    setIsSaving(true);
    try {
      const result = await actions.updateInformation(product.id, request);
      if (result.success) {
        setProduct(result.data);
        toast.success("Đã cập nhật thông tin sản phẩm.");
      } else {
        toast.error(result.error.message);
      }
      return result;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRentalRate = async (request: EquipmentListingRentalRate) => {
    setIsSaving(true);
    try {
      const result = await actions.updateRentalRate(product.id, request);
      if (result.success) {
        setProduct((prev) => ({
          ...prev,
          rentalRate: result.data,
        }));
        toast.success("Đã cập nhật giá thuê.");
      } else {
        toast.error(result.error.message);
      }
      return result;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateRentalRateAndDeposit = async (
    rateRequest: EquipmentListingRentalRate,
    depositAmount: number,
  ) => {
    setIsSaving(true);
    try {
      const ratePromise = actions.updateRentalRate(product.id, rateRequest);
      const depositPromise = actions.updateInformation(product.id, { depositAmount });

      const [rateResult, depositResult] = await Promise.all([ratePromise, depositPromise]);

      if (rateResult.success && depositResult.success) {
        setProduct(depositResult.data);
        toast.success("Đã cập nhật giá thuê và tiền cọc.");
      } else {
        if (!rateResult.success) toast.error(rateResult.error.message);
        if (!depositResult.success) toast.error(depositResult.error.message);
      }
      return { rateResult, depositResult };
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden bg-background">
      {/* Header Bar */}
      <div className="shrink-0 border-b border-border bg-card p-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <Button
              asChild
              className="mt-0.5 size-8 shrink-0 rounded-lg p-0"
              size="icon"
              variant="secondary"
            >
              <Link href="/own/products" title="Quay lại danh sách sản phẩm">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>

            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:size-16">
              <ProductImage
                compact
                name={productName}
                role="thumbnail"
                sizes="64px"
                src={product.thumbnailUrl}
              />
            </div>

            <div className="min-w-0 flex-1">
              <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link className="hover:text-primary transition-colors" href="/own/products">
                  Quản lý sản phẩm
                </Link>
                <span>/</span>
                <span className="truncate font-medium text-foreground">{productName}</span>
              </nav>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
                  {productName}
                </h1>
                <Badge variant={product.status === 1 ? "success" : "muted"}>
                  {getEquipmentListingStatusLabel(product.status)}
                </Badge>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {product.model ? (
                  <span>
                    Model: <strong className="font-semibold text-foreground">{product.model}</strong>
                  </span>
                ) : null}
                <span>
                  Số máy vật lý: <strong className="font-semibold text-foreground">{product.totalQuantity ?? 0} máy</strong>
                </span>
                <span>
                  Giá thuê:{" "}
                  <strong className="font-semibold text-primary">
                    {formatEquipmentListingRate(product.rentalRate?.dailyRate, product.rentalRate?.currency)} / ngày
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2 self-end lg:self-center">
            <Button
              onClick={() => setIsEditDialogOpen(true)}
              size="sm"
              type="button"
              variant="secondary"
              className="gap-1.5"
            >
              <Edit className="size-4" />
              Sửa thông tin sản phẩm
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-5 flex gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setActiveTab("assets")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "assets"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Cpu className="size-4" />
            Máy vật lý ({product.totalQuantity ?? 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "calendar"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <CalendarDays className="size-4" />
            Lịch sử dụng
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeTab === "info"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <FileText className="size-4" />
            Thông tin chi tiết
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "assets" ? (
          <ProductAssetsView
            actions={actions}
            fixedProduct={product}
            initialProducts={[product]}
          />
        ) : activeTab === "calendar" ? (
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <ProductCalendarPanel
              fetchCalendar={actions.fetchCalendar}
              productId={product.id}
              revision={calendarRevision}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-foreground">Thông tin chung</h3>
                  <Button
                    onClick={() => setIsEditDialogOpen(true)}
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs gap-1.5"
                  >
                    <Edit className="size-3.5" />
                    Chỉnh sửa
                  </Button>
                </div>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Tên sản phẩm</dt>
                    <dd className="mt-1 font-semibold text-foreground">{productName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Model</dt>
                    <dd className="mt-1 font-semibold text-foreground">{product.model || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Loại thiết bị</dt>
                    <dd className="mt-1 font-semibold text-foreground">{typeName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Thương hiệu</dt>
                    <dd className="mt-1 font-semibold text-foreground">{brandName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Năm sản xuất</dt>
                    <dd className="mt-1 font-semibold text-foreground">{product.manufactureYear || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Ngày tạo</dt>
                    <dd className="mt-1 font-medium tabular-nums">{formatEquipmentListingDate(product.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Cập nhật gần nhất</dt>
                    <dd className="mt-1 font-medium tabular-nums">{formatEquipmentListingDate(product.updatedAt)}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                <h3 className="text-sm font-bold text-foreground border-b border-border pb-3">Giá thuê & Tiền cọc</h3>
                <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Giá theo ngày</dt>
                    <dd className="mt-1 font-bold text-primary">
                      {formatEquipmentListingRate(product.rentalRate?.dailyRate, product.rentalRate?.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Giá theo tuần</dt>
                    <dd className="mt-1 font-bold text-foreground">
                      {formatEquipmentListingRate(product.rentalRate?.weeklyRate, product.rentalRate?.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Giá theo tháng</dt>
                    <dd className="mt-1 font-bold text-foreground">
                      {formatEquipmentListingRate(product.rentalRate?.monthlyRate, product.rentalRate?.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tiền cọc yêu cầu</dt>
                    <dd className="mt-1 font-bold text-foreground">
                      {formatEquipmentListingRate(product.depositAmount, product.rentalRate?.currency ?? "VND")}
                    </dd>
                  </div>
                </dl>
              </div>

              {product.description ? (
                <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
                  <h3 className="text-sm font-bold text-foreground border-b border-border pb-3">Mô tả sản phẩm</h3>
                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Product Edit Drawer */}
      {isEditDialogOpen ? (
        <ProductEditDrawer
          actions={actions}
          fetchBrands={actions.fetchBrands}
          product={product}
          brandName={brandName}
          typeName={typeName}
          selectedName={productName}
          error={null}
          isLoading={false}
          isSubmitting={isSaving}
          onOpenChange={setIsEditDialogOpen}
          onUpdateInformation={handleUpdateInformation}
          onUpdateRentalRate={handleUpdateRentalRate}
          onUpdateRentalRateAndDeposit={handleUpdateRentalRateAndDeposit}
        />
      ) : null}
    </div>
  );
}
