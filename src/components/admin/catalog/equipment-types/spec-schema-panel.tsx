"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Plus, RefreshCw, Save, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { DataTableState } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  catalogSpecSchemaFormSchema,
  getSpecFieldFormValues,
  toSpecDefinition,
  type CatalogSpecSchemaFormValues,
} from "@/lib/validations/catalog-spec-schema";
import type { CatalogSpecSchema } from "@/types/catalog";

import type { CatalogSpecSchemaActions } from "./equipment-type-management-types";
import { SpecSchemaFieldEditor } from "./spec-schema-field-editor";

export function SpecSchemaPanel({
  actions,
  equipmentTypeId,
  onPublished,
  onStateChange,
}: {
  actions: CatalogSpecSchemaActions;
  equipmentTypeId: string;
  onPublished: () => void;
  onStateChange: (state: { busy: boolean; dirty: boolean }) => void;
}) {
  const [versions, setVersions] = useState<CatalogSpecSchema[]>([]);
  const [selectedSchema, setSelectedSchema] =
    useState<CatalogSpecSchema | null>(null);
  const [isNewDraft, setIsNewDraft] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operation, setOperation] = useState<"save" | "publish" | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null);
  const requestIdRef = useRef(0);
  const form = useForm<CatalogSpecSchemaFormValues>({
    defaultValues: { fields: [] },
    resolver: zodResolver(catalogSpecSchemaFormSchema),
  });
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    reset,
    getValues,
    trigger,
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "fields" });
  const {
    fetchVersion,
    fetchVersions,
    createDraft,
    replaceDraft,
    publishDraft,
  } = actions;
  const isEditable = isNewDraft || isDraftSchema(selectedSchema);
  const isBusy = isLoading || operation !== null;

  useEffect(() => {
    onStateChange({ busy: operation !== null, dirty: isDirty || isNewDraft });
  }, [isDirty, isNewDraft, onStateChange, operation]);

  const selectSchema = useCallback(
    (schema: CatalogSpecSchema | null) => {
      setSelectedSchema(schema);
      setIsNewDraft(false);
      setMutationError(null);
      reset({
        fields: (schema?.definition?.fields ?? []).map((field) =>
          getSpecFieldFormValues(field),
        ),
      });
    },
    [reset],
  );

  const loadVersions = useCallback(
    async (preferredVersion?: number) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = sortVersions(await fetchVersions(equipmentTypeId));
        if (requestId !== requestIdRef.current) return;
        setVersions(result);
        const version =
          result.find((schema) => schema.version === preferredVersion)
            ?.version ?? result[0]?.version;
        const schema =
          version === undefined
            ? null
            : await fetchVersion(equipmentTypeId, version);
        if (requestId === requestIdRef.current) selectSchema(schema);
      } catch (error) {
        if (requestId === requestIdRef.current)
          setLoadError(getErrorMessage(error));
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [equipmentTypeId, fetchVersion, fetchVersions, selectSchema],
  );

  useEffect(() => {
    const requestRef = requestIdRef;
    const timeout = window.setTimeout(() => void loadVersions(), 0);
    return () => {
      window.clearTimeout(timeout);
      ++requestRef.current;
    };
  }, [loadVersions]);

  function navigate(action: () => void) {
    if (isDirty || isNewDraft) setPendingNavigation(() => action);
    else action();
  }

  async function loadVersion(version: number) {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const schema = await fetchVersion(equipmentTypeId, version);
      if (requestId === requestIdRef.current) selectSchema(schema);
    } catch (error) {
      if (requestId === requestIdRef.current)
        setLoadError(getErrorMessage(error));
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }

  function startDraft() {
    setIsNewDraft(true);
    setMutationError(null);
    reset({
      fields: (selectedSchema?.definition?.fields ?? []).map((field) =>
        getSpecFieldFormValues(field),
      ),
    });
  }

  function acceptSchema(schema: CatalogSpecSchema) {
    setVersions((current) =>
      sortVersions([
        ...current.filter((item) => item.version !== schema.version),
        schema,
      ]),
    );
    selectSchema(schema);
  }

  async function saveDraft(values: CatalogSpecSchemaFormValues) {
    if (
      !isEditable ||
      isBusy ||
      (!isNewDraft && selectedSchema?.version === undefined)
    )
      return;
    const requestId = ++requestIdRef.current;
    setOperation("save");
    setMutationError(null);
    try {
      const definition = toSpecDefinition(values);
      const result = isNewDraft
        ? await createDraft(equipmentTypeId, definition)
        : await replaceDraft(
            equipmentTypeId,
            selectedSchema!.version!,
            definition,
          );
      if (requestId !== requestIdRef.current) return;
      acceptSchema(result);
      toast.success("Đã lưu bản nháp thông số kỹ thuật.");
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setMutationError(getErrorMessage(error));
        toast.error(getErrorMessage(error));
      }
    } finally {
      if (requestId === requestIdRef.current) setOperation(null);
    }
  }

  async function publish() {
    if (
      !isDraftSchema(selectedSchema) ||
      selectedSchema?.version === undefined ||
      isDirty ||
      isNewDraft ||
      isBusy
    )
      return;
    const requestId = ++requestIdRef.current;
    setOperation("publish");
    setMutationError(null);
    try {
      const result = await publishDraft(
        equipmentTypeId,
        selectedSchema.version,
      );
      if (requestId !== requestIdRef.current) return;
      acceptSchema(result);
      setIsPublishConfirmOpen(false);
      toast.success("Đã xuất bản thông số kỹ thuật.");
      onPublished();
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setMutationError(getErrorMessage(error));
        setIsPublishConfirmOpen(false);
        toast.error(getErrorMessage(error));
      }
    } finally {
      if (requestId === requestIdRef.current) setOperation(null);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Phiên bản thông số kỹ thuật"
          className="h-10 min-w-0 flex-1 rounded border border-input bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-60"
          disabled={isBusy || !versions.length}
          onChange={(event) => {
            const version = Number(event.target.value);
            navigate(() => void loadVersion(version));
          }}
          value={isNewDraft ? "new" : (selectedSchema?.version ?? "")}
        >
          {isNewDraft ? <option value="new">Bản nháp mới</option> : null}
          {!versions.length && !isNewDraft ? (
            <option value="">Chưa có phiên bản</option>
          ) : null}
          {versions.map((schema) => (
            <option key={schema.version} value={schema.version}>
              v{schema.version} · {schemaStatusLabel(schema)}
            </option>
          ))}
        </select>
        <Button
          aria-label="Tải lại phiên bản"
          disabled={isBusy}
          onClick={() =>
            navigate(() => void loadVersions(selectedSchema?.version))
          }
          size="icon"
          title="Tải lại phiên bản"
          type="button"
          variant="secondary"
        >
          <RefreshCw className={isLoading ? "size-4 animate-spin" : "size-4"} />
        </Button>
        <Button
          disabled={isBusy || isNewDraft || !!loadError}
          onClick={() => navigate(startDraft)}
          type="button"
          variant="secondary"
        >
          <Plus className="size-4" />
          Tạo bản nháp
        </Button>
      </div>

      {isLoading ? (
        <SchemaSkeleton />
      ) : loadError ? (
        <div className="grid min-h-64 place-items-center">
          <DataTableState filtered message={loadError} variant="error" />
        </div>
      ) : !selectedSchema && !isNewDraft ? (
        <div className="grid min-h-64 place-items-center">
          <DataTableState
            filtered
            message="Chưa có schema thông số kỹ thuật."
          />
        </div>
      ) : (
        <FormProvider {...form}>
          <form
            noValidate
            onSubmit={(event) => void handleSubmit(saveDraft)(event)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
              <h2 className="text-sm font-semibold">
                {isNewDraft
                  ? "Bản nháp mới"
                  : `Phiên bản v${selectedSchema?.version}`}{" "}
                · {fields.length} thông số
              </h2>
              <Badge variant={isEditable ? "warning" : "success"}>
                {isNewDraft ? "Bản nháp" : schemaStatusLabel(selectedSchema)}
              </Badge>
            </div>
            <fieldset disabled={!isEditable || isBusy} className="min-w-0">
              {fields.map((field, index) => (
                <SpecSchemaFieldEditor
                  index={index}
                  key={field.id}
                  onRemove={() => remove(index)}
                  readOnly={!isEditable || isBusy}
                />
              ))}
              {isEditable ? (
                <Button
                  className="mt-4"
                  onClick={() =>
                    append(
                      getSpecFieldFormValues(
                        undefined,
                        Math.max(
                          -1,
                          ...getValues("fields").map((field) =>
                            Number.isFinite(field.displayOrder)
                              ? field.displayOrder
                              : -1,
                          ),
                        ) + 1,
                      ),
                    )
                  }
                  type="button"
                  variant="secondary"
                >
                  <Plus className="size-4" />
                  Thêm thông số
                </Button>
              ) : null}
            </fieldset>
            {errors.fields?.message || errors.fields?.root?.message ? (
              <p className="mt-3 text-sm text-error" role="alert">
                {errors.fields.message ?? errors.fields.root?.message}
              </p>
            ) : null}
            {mutationError ? (
              <p
                className="mt-3 whitespace-pre-line break-words text-sm text-error"
                role="alert"
              >
                {mutationError}
              </p>
            ) : null}
            {isEditable ? (
              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border bg-background py-4">
                {isNewDraft ? (
                  <Button
                    disabled={isBusy}
                    onClick={() => navigate(() => selectSchema(selectedSchema))}
                    type="button"
                    variant="secondary"
                  >
                    Hủy bản nháp mới
                  </Button>
                ) : null}
                <Button
                  disabled={isBusy || (!isNewDraft && !isDirty)}
                  type="submit"
                >
                  {operation === "save" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isNewDraft ? "Tạo bản nháp" : "Lưu bản nháp"}
                </Button>
                {!isNewDraft ? (
                  <Button
                    disabled={isBusy || isDirty}
                    onClick={async () => {
                      if (await trigger()) setIsPublishConfirmOpen(true);
                    }}
                    title={
                      isDirty
                        ? "Lưu thay đổi trước khi xuất bản"
                        : "Xuất bản phiên bản này"
                    }
                    type="button"
                    variant="secondary"
                  >
                    <Send className="size-4" />
                    Xuất bản
                  </Button>
                ) : null}
              </div>
            ) : null}
          </form>
        </FormProvider>
      )}
      <ConfirmDialog
        confirmLabel="Xuất bản"
        description={`Xuất bản v${selectedSchema?.version} làm schema hiện hành? Phiên bản này sẽ không thể chỉnh sửa sau khi xuất bản.`}
        icon={<Send className="size-5" />}
        isSubmitting={operation === "publish"}
        onConfirm={() => void publish()}
        onOpenChange={setIsPublishConfirmOpen}
        open={isPublishConfirmOpen}
        title="Xuất bản thông số kỹ thuật"
      />
      <ConfirmDialog
        confirmLabel="Bỏ thay đổi"
        description="Các thay đổi chưa lưu sẽ bị bỏ. Bạn có muốn tiếp tục?"
        onConfirm={() => {
          const action = pendingNavigation;
          setPendingNavigation(null);
          action?.();
        }}
        onOpenChange={(open) => {
          if (!open) setPendingNavigation(null);
        }}
        open={pendingNavigation !== null}
        title="Bỏ thay đổi chưa lưu?"
        variant="danger"
      />
    </div>
  );
}

function isDraftSchema(schema: CatalogSpecSchema | null) {
  return schema?.status?.toLowerCase() === "draft" && !schema.publishedAt;
}

function schemaStatusLabel(schema: CatalogSpecSchema | null) {
  if (isDraftSchema(schema)) return "Bản nháp";
  if (schema?.status?.toLowerCase() === "published" || schema?.publishedAt)
    return "Đã xuất bản";
  return schema?.status || "Không xác định";
}

function sortVersions(versions: CatalogSpecSchema[]) {
  return [...versions].sort(
    (left, right) => (right.version ?? 0) - (left.version ?? 0),
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Không thể thực hiện thao tác với schema.";
}

function SchemaSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải thông số kỹ thuật"
      className="space-y-5"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div className="space-y-3" key={index}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
