"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, RefreshCw, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";

import { DynamicSpecificationFields } from "@/components/catalog/dynamic-specification-fields";
import { DataTableState } from "@/components/data-table";
import { FormDrawer } from "@/components/forms/form-drawer";
import { MoneyField } from "@/components/forms/money-field";
import { SearchableSelectField } from "@/components/forms/searchable-select-field";
import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalogSelectOptions } from "@/hooks/use-catalog-select-options";
import {
  buildSpecificationValues,
  getSpecificationSchemaError,
} from "@/lib/validations/catalog-spec-values";
import {
  productInformationFormSchema,
  getProductSpecificationFormSchema,
  productRentalRateFormSchema,
  type ProductInformationFormValues,
  type ProductSpecificationFormValues,
  type ProductRentalRateFormValues,
} from "@/lib/validations/inventory-product";
import type { ApiErrorDetails, ApiResult } from "@/services/api-error";
import type { CatalogSpecField } from "@/types/catalog";
import {
  EQUIPMENT_LISTING_STATUS,
  type EquipmentListingStatus,
  type EquipmentListing,
  type EquipmentListingRentalRate,
  type UpdateEquipmentListingRequest,
} from "@/types/inventory";
import {
  formatEquipmentListingDate,
  getEquipmentListingName,
  getEquipmentListingMedia,
  getEquipmentListingStatusValue,
  getEquipmentListingStatusLabel,
} from "@/utils/inventory";

import {
  CatalogOptionsState,
  ProductImageField,
  SchemaLoadState,
} from "./product-create-drawer";
import type {
  ProductCreateActions,
  ProductDetailActions,
} from "./product-management-types";

const INFO_FORM_ID = "own-update-product-information";
const RATE_FORM_ID = "own-update-product-rental-rate";
const SPEC_FORM_ID = "own-update-product-specifications";

type ProductDetailDrawerProps = {
  actions: ProductDetailActions;
  fetchBrands: ProductCreateActions["fetchBrands"];
  product: EquipmentListing | null;
  brandName?: string;
  typeName?: string;
  selectedName: string;
  error: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh?: () => void;
  initialTab?: string;
  onUpdateInformation: (
    request: UpdateEquipmentListingRequest,
  ) => Promise<ApiResult<EquipmentListing> | undefined>;
  onUpdateRentalRate: (
    request: EquipmentListingRentalRate,
  ) => Promise<ApiResult<EquipmentListingRentalRate> | undefined>;
};

export function ProductEditDrawer(props: ProductDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState(props.initialTab ?? "information");
  const [visitedTabs, setVisitedTabs] = useState([
    props.initialTab ?? "information",
  ]);
  const [specificationReady, setSpecificationReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const isBusy = props.isLoading || props.isSubmitting || isUploading;

  return (
    <FormDrawer
      activeTab={activeTab}
      className="sm:max-w-2xl"
      description={
        props.product
          ? getEquipmentListingName(props.product)
          : props.selectedName
      }
      footer={
        <div className="flex w-full flex-wrap justify-end gap-2">
          {props.onRefresh ? (
            <Button
              disabled={isBusy}
              onClick={props.onRefresh}
              size="sm"
              type="button"
              variant="ghost"
            >
              <RefreshCw
                className={props.isLoading ? "size-4 animate-spin" : "size-4"}
              />
              Tải lại
            </Button>
          ) : null}
          {props.product && !props.error ? (
            <Button
              disabled={
                isBusy ||
                (activeTab === "specifications" && !specificationReady)
              }
              form={
                activeTab === "information"
                  ? INFO_FORM_ID
                  : activeTab === "specifications"
                    ? SPEC_FORM_ID
                    : RATE_FORM_ID
              }
              size="sm"
              type="submit"
            >
              {props.isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {props.isSubmitting
                ? "Đang lưu..."
                : activeTab === "information"
                  ? "Lưu thông tin"
                  : activeTab === "specifications"
                    ? "Lưu thông số"
                    : "Lưu giá thuê"}
            </Button>
          ) : null}
          <Button
            disabled={props.isSubmitting || isUploading}
            onClick={() => props.onOpenChange(false)}
            size="sm"
            type="button"
            variant="secondary"
          >
            Đóng
          </Button>
        </div>
      }
      onOpenChange={(open) => {
        if (!props.isSubmitting && !isUploading) props.onOpenChange(open);
      }}
      onTabChange={(tab) => {
        if (!isBusy) {
          setActiveTab(tab);
          setVisitedTabs((tabs) =>
            tabs.includes(tab) ? tabs : [...tabs, tab],
          );
        }
      }}
      open
      tabs={[
        { label: "Thông tin", value: "information" },
        { label: "Thông số kỹ thuật", value: "specifications" },
        { label: "Giá thuê", value: "rental-rate" },
      ]}
      title="Sửa sản phẩm"
    >
      {props.isLoading ? (
        <div
          aria-busy="true"
          aria-label="Đang tải chi tiết sản phẩm"
          className="space-y-5"
        >
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : props.error ? (
        <div className="grid min-h-64 place-items-center">
          <DataTableState message={props.error} variant="error" />
          <Button
            onClick={props.onRefresh}
            size="sm"
            type="button"
            variant="secondary"
          >
            Thử lại
          </Button>
        </div>
      ) : props.product ? (
        <ProductDetailForms
          {...props}
          activeTab={activeTab}
          isBusy={isBusy}
          key={props.product.id}
          onUploadingChange={setIsUploading}
          onSpecificationReadyChange={setSpecificationReady}
          product={props.product}
          visitedTabs={visitedTabs}
        />
      ) : null}
    </FormDrawer>
  );
}

function ProductDetailForms({
  activeTab,
  actions,
  brandName,
  typeName,
  fetchBrands,
  isBusy,
  onUpdateInformation,
  onUpdateRentalRate,
  onUploadingChange,
  onSpecificationReadyChange,
  product,
  visitedTabs,
}: ProductDetailDrawerProps & {
  activeTab: string;
  isBusy: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onSpecificationReadyChange: (ready: boolean) => void;
  product: EquipmentListing;
  visitedTabs: string[];
}) {
  // Each form keeps its own values, including after saving the other tab.
  const [initialProduct] = useState(product);
  const [initialMedia] = useState(() => getEquipmentListingMedia(product));
  const savedThumbnailRef = useRef(product.thumbnailMediaId);
  const savedMediaIdsRef = useRef(initialMedia.map((item) => item.id));
  const brands = useCatalogSelectOptions(
    fetchBrands,
    visitedTabs.includes("information"),
  );
  const [initialBrandName] = useState(brandName ?? "Thương hiệu hiện tại");
  const [imagePreviewUrls, setImagePreviewUrls] = useState<
    Record<string, string | null>
  >(() => Object.fromEntries(initialMedia.map((item) => [item.id, item.url])));
  const informationForm = useForm<ProductInformationFormValues>({
    defaultValues: {
      brandId: initialProduct.brandId,
      name: getEquipmentListingName(initialProduct),
      description: initialProduct.description ?? "",
      status: String(
        getEquipmentListingStatusValue(initialProduct.status) ?? "",
      ) as ProductInformationFormValues["status"],
      model: initialProduct.model ?? "",
      manufactureYear: initialProduct.manufactureYear?.toString() ?? "",
      mediaIds: initialMedia.map((item) => item.id),
      thumbnailMediaId: initialProduct.thumbnailMediaId ?? "",
      depositAmount: String(initialProduct.depositAmount ?? 0),
    },
    resolver: zodResolver(productInformationFormSchema),
    shouldFocusError: false,
  });
  const thumbnailMediaId = useWatch({
    control: informationForm.control,
    name: "thumbnailMediaId",
  });
  const rateForm = useForm<ProductRentalRateFormValues>({
    defaultValues: {
      dailyRate: initialProduct.rentalRate?.dailyRate?.toString() ?? "",
      weeklyRate: initialProduct.rentalRate?.weeklyRate?.toString() ?? "",
      monthlyRate: initialProduct.rentalRate?.monthlyRate?.toString() ?? "",
    },
    resolver: zodResolver(productRentalRateFormSchema),
  });
  async function submitInformation(values: ProductInformationFormValues) {
    if (isBusy) return;
    informationForm.clearErrors();
    const request: UpdateEquipmentListingRequest = {
      brandId: values.brandId,
      name: values.name,
      model: values.model,
    };
    if (dirtyFields.description)
      request.description = values.description || null;
    if (dirtyFields.status)
      request.status = Number(values.status) as EquipmentListingStatus;
    if (dirtyFields.depositAmount)
      request.depositAmount = Number(values.depositAmount);
    if (dirtyFields.manufactureYear)
      request.manufactureYear = values.manufactureYear
        ? Number(values.manufactureYear)
        : null;
    if (
      JSON.stringify(values.mediaIds) !==
      JSON.stringify(savedMediaIdsRef.current)
    )
      request.mediaIds = values.mediaIds;
    // Omit unchanged media and specifications in PATCH to preserve existing data.
    if ((values.thumbnailMediaId || null) !== savedThumbnailRef.current)
      request.thumbnailMediaId = values.thumbnailMediaId || null;
    try {
      const result = await onUpdateInformation(request);
      if (result?.success) {
        savedThumbnailRef.current = result.data.thumbnailMediaId;
        savedMediaIdsRef.current = [...values.mediaIds];
        informationForm.reset(values);
      } else if (result) applyServerErrors(informationForm, result.error);
    } catch (error) {
      informationForm.setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật thông tin sản phẩm.",
      });
    }
  }

  async function submitRentalRate(values: ProductRentalRateFormValues) {
    if (isBusy) return;
    rateForm.clearErrors();
    try {
      const result = await onUpdateRentalRate({
        dailyRate: Number(values.dailyRate),
        weeklyRate: Number(values.weeklyRate),
        monthlyRate: Number(values.monthlyRate),
        currency: "VND",
      });
      if (result?.success) rateForm.reset(values);
      else if (result) applyServerErrors(rateForm, result.error);
    } catch (error) {
      rateForm.setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật giá thuê.",
      });
    }
  }

  const brandOptions = brands.items.map((brand) => ({
    label: brand.name,
    value: brand.id,
  }));
  const { dirtyFields } = informationForm.formState;
  if (!brandOptions.some((option) => option.value === initialProduct.brandId))
    brandOptions.unshift({
      label: initialBrandName,
      value: initialProduct.brandId,
    });

  return (
    <>
      <form
        className="space-y-5"
        hidden={activeTab !== "information"}
        id={INFO_FORM_ID}
        noValidate
        onSubmit={(event) => {
          void informationForm.handleSubmit(submitInformation)(event);
        }}
      >
        <FormServerError
          message={informationForm.formState.errors.root?.server?.message}
        />
        <TextField
          {...informationForm.register("name")}
          disabled={isBusy}
          error={informationForm.formState.errors.name?.message}
          id={`${INFO_FORM_ID}-name`}
          label="Tên sản phẩm"
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            disabled
            id={`${INFO_FORM_ID}-type`}
            label="Loại thiết bị"
            readOnly
            value={typeName || "—"}
          />
          <div className="space-y-2">
            <Controller
              control={informationForm.control}
              name="brandId"
              render={({ field, fieldState }) => (
                <SearchableSelectField
                  {...field}
                  disabled={isBusy || brands.isLoading}
                  error={fieldState.error?.message}
                  id={`${INFO_FORM_ID}-brandId`}
                  label="Thương hiệu"
                  options={brandOptions}
                  required
                />
              )}
            />
            <CatalogOptionsState
              {...brands}
              disabled={isBusy}
              label="thương hiệu"
              showLoadingMessage={false}
            />
          </div>
          <TextField
            {...informationForm.register("model")}
            disabled={isBusy}
            error={informationForm.formState.errors.model?.message}
            id={`${INFO_FORM_ID}-model`}
            label="Model sản phẩm"
            required
          />
          <Controller
            control={informationForm.control}
            name="status"
            render={({ field, fieldState }) => (
              <SearchableSelectField
                {...field}
                disabled={isBusy}
                error={fieldState.error?.message}
                id={`${INFO_FORM_ID}-status`}
                label="Trạng thái"
                options={Object.values(EQUIPMENT_LISTING_STATUS).map(
                  (value) => ({
                    value: String(value),
                    label: getEquipmentListingStatusLabel(value),
                  }),
                )}
                required
              />
            )}
          />
          <TextField
            {...informationForm.register("manufactureYear")}
            disabled={isBusy}
            error={informationForm.formState.errors.manufactureYear?.message}
            id={`${INFO_FORM_ID}-manufactureYear`}
            label="Năm sản xuất"
            placeholder="VD: 2024"
            inputMode="numeric"
            maxLength={4}
          />
        </div>
        <TextareaField
          {...informationForm.register("description")}
          className="min-h-24"
          disabled={isBusy}
          error={informationForm.formState.errors.description?.message}
          id={`${INFO_FORM_ID}-description`}
          label="Mô tả sản phẩm"
        />
        <Controller
          control={informationForm.control}
          name="depositAmount"
          render={({ field, fieldState }) => (
            <MoneyField
              {...field}
              disabled={isBusy}
              error={fieldState.error?.message}
              id={`${INFO_FORM_ID}-depositAmount`}
              label="Tiền cọc"
              placeholder="Nhập 0 nếu không yêu cầu tiền cọc"
              required
              rightElement={
                <span className="px-2 text-xs text-muted-foreground">VND</span>
              }
            />
          )}
        />
        <Controller
          control={informationForm.control}
          name="mediaIds"
          render={({ field, fieldState }) => (
            <ProductImageField
              disabled={isBusy}
              error={
                fieldState.error?.message ||
                informationForm.formState.errors.thumbnailMediaId?.message
              }
              onChange={(media, thumbnail) => {
                field.onChange(media.map((item) => item.id));
                informationForm.setValue("thumbnailMediaId", thumbnail, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setImagePreviewUrls(
                  Object.fromEntries(media.map((item) => [item.id, item.url])),
                );
              }}
              onUploadingChange={onUploadingChange}
              thumbnailMediaId={thumbnailMediaId}
              value={field.value.map((id) => ({
                id,
                url: imagePreviewUrls[id] ?? null,
              }))}
            />
          )}
        />
        <dl className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <dt>Số lượng thiết bị</dt>
            <dd className="text-foreground">{product.totalQuantity}</dd>
          </div>
          <div>
            <dt>Ngày tạo</dt>
            <dd className="text-foreground">
              {formatEquipmentListingDate(product.createdAt)}
            </dd>
          </div>
          <div>
            <dt>Cập nhật</dt>
            <dd className="text-foreground">
              {formatEquipmentListingDate(product.updatedAt)}
            </dd>
          </div>
        </dl>
      </form>
      <form
        className="space-y-5"
        hidden={activeTab !== "rental-rate"}
        id={RATE_FORM_ID}
        noValidate
        onSubmit={rateForm.handleSubmit(submitRentalRate)}
      >
        <FormServerError
          message={rateForm.formState.errors.root?.server?.message}
        />
        <h2 className="text-sm font-semibold">Giá thuê (VND)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["dailyRate", "Giá / ngày"],
              ["weeklyRate", "Giá / tuần"],
              ["monthlyRate", "Giá / tháng"],
            ] as const
          ).map(([name, label]) => (
            <Controller
              control={rateForm.control}
              key={name}
              name={name}
              render={({ field, fieldState }) => (
                <MoneyField
                  {...field}
                  disabled={isBusy}
                  error={fieldState.error?.message}
                  id={`${RATE_FORM_ID}-${name}`}
                  label={label}
                  placeholder="VD: 100.000"
                  required
                  rightElement={
                    <span className="px-2 text-xs text-muted-foreground">
                      VND
                    </span>
                  }
                />
              )}
            />
          ))}
        </div>
      </form>
      {visitedTabs.includes("specifications") ? (
        <div hidden={activeTab !== "specifications"}>
          <ProductSpecificationForm
            fetchSchema={actions.fetchSchemaVersion}
            isBusy={isBusy}
            onReadyChange={onSpecificationReadyChange}
            onSubmit={onUpdateInformation}
            product={product}
          />
        </div>
      ) : null}
    </>
  );
}

function ProductSpecificationForm({
  product,
  fetchSchema,
  isBusy,
  onReadyChange,
  onSubmit,
}: {
  product: EquipmentListing;
  fetchSchema: ProductDetailActions["fetchSchemaVersion"];
  isBusy: boolean;
  onReadyChange: (ready: boolean) => void;
  onSubmit: ProductDetailDrawerProps["onUpdateInformation"];
}) {
  const [initialProduct] = useState(product);
  const [fields, setFields] = useState<CatalogSpecField[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaAttempt, setSchemaAttempt] = useState(0);
  const validation = useMemo(
    () => getProductSpecificationFormSchema(fields),
    [fields],
  );
  const form = useForm<ProductSpecificationFormValues>({
    defaultValues: { specInputs: [] },
    resolver: zodResolver(validation),
  });
  const specs = useWatch({ control: form.control, name: "specInputs" });
  const { reset } = form;

  useEffect(() => {
    onReadyChange(!schemaLoading && !schemaError);
  }, [onReadyChange, schemaLoading, schemaError]);
  useEffect(() => {
    let cancelled = false;
    async function loadSchema() {
      setSchemaLoading(true);
      setSchemaError(null);
      try {
        const result = await fetchSchema(
          initialProduct.equipmentTypeId,
          initialProduct.schemaVersion,
        );
        if (cancelled) return;
        if (!result.success) throw new Error(result.error.message);
        if (
          (result.data.schemaVersion ?? result.data.version) !==
            initialProduct.schemaVersion ||
          (result.data.equipmentTypeId &&
            result.data.equipmentTypeId !== initialProduct.equipmentTypeId)
        )
          throw new Error(
            "Không thể tải đúng phiên bản thông số của sản phẩm.",
          );
        const nextFields = result.data.fields ?? [];
        const invalidSchema = getSpecificationSchemaError(nextFields);
        if (invalidSchema) throw new Error(invalidSchema);
        const specValues =
          typeof initialProduct.specValues === "string"
            ? JSON.parse(initialProduct.specValues)
            : initialProduct.specValues;
        if (
          !specValues ||
          typeof specValues !== "object" ||
          Array.isArray(specValues)
        )
          throw new Error("Thông số sản phẩm không hợp lệ.");
        const inputs = nextFields.map((field) => {
          const value = specValues[field.key ?? ""];
          return field.dataType?.toLowerCase() === "boolean"
            ? value === true
            : value == null
              ? ""
              : String(value);
        });
        setFields(nextFields);
        reset({ specInputs: inputs });
      } catch (error) {
        if (!cancelled)
          setSchemaError(
            error instanceof Error
              ? error.message
              : "Không thể tải thông số kỹ thuật.",
          );
      } finally {
        if (!cancelled) setSchemaLoading(false);
      }
    }
    const timeout = window.setTimeout(() => void loadSchema(), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [fetchSchema, initialProduct, schemaAttempt, reset]);

  async function submit(values: ProductSpecificationFormValues) {
    if (isBusy || schemaLoading || schemaError) return;
    form.clearErrors();
    try {
      const result = await onSubmit({
        schemaVersion: initialProduct.schemaVersion,
        specValues: buildSpecificationValues(fields, values.specInputs),
      });
      if (result?.success) form.reset(values);
      else if (result) applyServerErrors(form, result.error, fields);
    } catch (error) {
      form.setError("root.server", {
        message:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật thông số kỹ thuật.",
      });
    }
  }

  return (
    <form id={SPEC_FORM_ID} noValidate onSubmit={form.handleSubmit(submit)}>
      <FormServerError message={form.formState.errors.root?.server?.message} />
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Thông số kỹ thuật</h2>
        <SchemaLoadState
          disabled={isBusy}
          error={schemaError}
          isLoading={schemaLoading}
          onRetry={async () => {
            setSchemaAttempt((attempt) => attempt + 1);
          }}
        />
        {!schemaLoading && !schemaError ? (
          fields.length ? (
            <DynamicSpecificationFields
              disabled={isBusy}
              errors={fields.map(
                (_, index) =>
                  form.formState.errors.specInputs?.[index]?.message,
              )}
              fields={fields}
              onChange={(index, value) => {
                form.setValue(`specInputs.${index}`, value, {
                  shouldDirty: true,
                });
                form.clearErrors(`specInputs.${index}`);
              }}
              values={specs}
            />
          ) : (
            <div className="grid min-h-48 place-items-center">
              <DataTableState message="Loại thiết bị này không yêu cầu thông số bổ sung." />
            </div>
          )
        ) : null}
      </section>
    </form>
  );
}

function FormServerError({ message }: { message?: string }) {
  return message ? (
    <p
      className="whitespace-pre-line break-words rounded border border-error/20 bg-error/5 p-3 text-sm text-error"
      role="alert"
    >
      {message}
    </p>
  ) : null;
}

function applyServerErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: ApiErrorDetails,
  fields: CatalogSpecField[] = [],
) {
  form.setError("root.server", { message: error.message });
  for (const [path, messages] of Object.entries(error.fieldErrors)) {
    const normalized = path
      .replace(/^\$\./, "")
      .replace(/^rentalRate\./i, "")
      .toLowerCase();
    const specIndex = fields.findIndex(
      (field) =>
        normalized === `specValues.${field.key}`.toLowerCase() ||
        normalized === field.key?.toLowerCase(),
    );
    const name =
      specIndex >= 0
        ? `specInputs.${specIndex}`
        : Object.keys(form.getValues()).find(
            (key) => key.toLowerCase() === normalized,
          );
    if (name) form.setError(name as Path<T>, { message: messages.join("\n") });
  }
}
