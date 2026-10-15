"use client";

import { useCallback } from "react";
import {
  InformationReviewCard,
  InformationReviewList,
} from "@/components/forms/information-review-card";
import { ResourcePanel } from "@/components/layout/resource-panel";
import { DataTableState } from "@/components/data-table";
import { useApiResource } from "@/hooks/use-api-resource";
import type { CatalogSpecField } from "@/types/catalog";
import type { EquipmentListing } from "@/types/inventory";
import {
  formatEquipmentListingDate,
  formatEquipmentListingRate,
  getEquipmentListingStatusLabel,
} from "@/utils/inventory";
import type { ProductPageActions } from "./product-management-types";

export function ProductInformationPanel({
  product,
  brandName,
  typeName,
  fetchSchema,
  onEdit,
}: {
  product: EquipmentListing;
  brandName?: string;
  typeName?: string;
  fetchSchema: ProductPageActions["fetchSchemaVersion"];
  onEdit: (tab: string) => void;
}) {
  const request = useCallback(
    () => fetchSchema(product.equipmentTypeId, product.schemaVersion),
    [fetchSchema, product.equipmentTypeId, product.schemaVersion],
  );
  const schema = useApiResource(request);
  let specValues: Record<string, unknown> = {};
  let specError: string | null = null;
  try {
    const parsed =
      typeof product.specValues === "string"
        ? JSON.parse(product.specValues)
        : product.specValues;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      specValues = parsed;
    else specError = "Thông số sản phẩm không hợp lệ.";
  } catch {
    specError = "Không thể đọc thông số sản phẩm.";
  }
  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <InformationReviewCard
        onEdit={() => onEdit("information")}
        title="Thông tin sản phẩm"
      >
        <InformationReviewList
          rows={[
            { label: "Tên sản phẩm", value: product.name },
            { label: "Model", value: product.model },
            { label: "Năm sản xuất", value: product.manufactureYear },
            {
              label: "Mô tả",
              value: product.description ? (
                <span className="whitespace-pre-line break-words">
                  {product.description}
                </span>
              ) : null,
            },
            { label: "Loại thiết bị", value: typeName },
            { label: "Thương hiệu", value: brandName },
            {
              label: "Tiền cọc",
              value: formatEquipmentListingRate(product.depositAmount, "VND"),
            },
            {
              label: "Trạng thái",
              value: getEquipmentListingStatusLabel(product.status),
            },
            {
              label: "Ngày tạo",
              value: formatEquipmentListingDate(product.createdAt),
            },
            {
              label: "Cập nhật",
              value: formatEquipmentListingDate(product.updatedAt),
            },
          ]}
        />
      </InformationReviewCard>
      <InformationReviewCard
        onEdit={() => onEdit("rental-rate")}
        title="Giá thuê"
      >
        <InformationReviewList
          rows={[
            {
              label: "Giá / ngày",
              value: formatEquipmentListingRate(
                product.rentalRate?.dailyRate,
                "VND",
              ),
            },
            {
              label: "Giá / tuần",
              value: formatEquipmentListingRate(
                product.rentalRate?.weeklyRate,
                "VND",
              ),
            },
            {
              label: "Giá / tháng",
              value: formatEquipmentListingRate(
                product.rentalRate?.monthlyRate,
                "VND",
              ),
            },
          ]}
        />
      </InformationReviewCard>
      <div className="lg:col-span-2">
        <InformationReviewCard
          onEdit={() => onEdit("specifications")}
          title="Thông số kỹ thuật"
        >
          <ResourcePanel
            error={schema.error || specError}
            isLoading={schema.isLoading}
            onRetry={() => void schema.refresh()}
          >
            {schema.data?.fields?.length ? (
              <InformationReviewList
                rows={schema.data.fields.map((field) => ({
                  label: field.label || field.key || "Thông số",
                  value: formatSpecification(
                    field,
                    specValues[field.key ?? ""],
                  ),
                }))}
              />
            ) : (
              <div className="grid place-items-center">
                <DataTableState message="Loại thiết bị này không yêu cầu thông số bổ sung." />
              </div>
            )}
          </ResourcePanel>
        </InformationReviewCard>
      </div>
    </div>
  );
}

function formatSpecification(field: CatalogSpecField, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  const option = field.options?.find((item) => item.value === String(value));
  const formatted =
    option?.label ||
    (typeof value === "number"
      ? new Intl.NumberFormat("vi-VN").format(value)
      : String(value));
  return `${formatted}${field.unit ? ` ${field.unit}` : ""}`;
}
