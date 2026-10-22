"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  AddressFormFields,
  emptyAddress,
  getAddressFieldErrors,
  type AddressField,
  type AddressFieldErrors,
} from "@/components/account/address-form-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { renterAddressSchema } from "@/lib/validations/renter-address";
import { createRenterAddress, setDefaultRenterAddress } from "@/services/renter-address-service";
import type { SaveRenterAddressRequest } from "@/types/renter-address";

export function AddressCreateDialog({
  isFirstAddress,
  onChanged,
  onClose,
}: {
  isFirstAddress: boolean;
  onChanged: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [firstAddress] = useState(isFirstAddress);
  const [draft, setDraft] = useState<SaveRenterAddressRequest>(emptyAddress);
  const [fieldErrors, setFieldErrors] = useState<AddressFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [makeDefault, setMakeDefault] = useState(firstAddress);
  const createMutation = useMutation({ mutationFn: createRenterAddress });
  const defaultMutation = useMutation({ mutationFn: setDefaultRenterAddress });
  const isSaving = createMutation.isPending || defaultMutation.isPending;

  function updateDraft(field: AddressField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const parsed = renterAddressSchema.safeParse(draft);
    if (!parsed.success) {
      setFieldErrors(getAddressFieldErrors(parsed.error.flatten().fieldErrors));
      return;
    }

    setFormError("");
    let created;
    try {
      created = await createMutation.mutateAsync(parsed.data);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể thêm địa chỉ.");
      return;
    }

    let defaultFailed = false;
    if (makeDefault && !created.isDefault) {
      try {
        await defaultMutation.mutateAsync(created.id);
      } catch {
        defaultFailed = true;
      }
    }

    await onChanged();
    onClose();
    if (defaultFailed) {
      toast.error("Đã thêm địa chỉ nhưng chưa đặt mặc định. Bạn có thể thử lại trong danh sách.");
    } else {
      toast.success(makeDefault ? "Đã thêm địa chỉ mặc định." : "Đã thêm địa chỉ.");
    }
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open && !isSaving) onClose(); }} open>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm địa chỉ nhận hàng</DialogTitle>
          <DialogDescription>Thông tin này sẽ được dùng khi bạn chọn địa chỉ đã lưu để đặt hàng.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <AddressFormFields disabled={isSaving} draft={draft} errors={fieldErrors} idPrefix="create-address" onChange={updateDraft} />
          <div className="flex items-start gap-2">
            <Checkbox
              checked={makeDefault}
              className="mt-0.5 disabled:opacity-100"
              disabled={isSaving || firstAddress}
              id="create-address-default"
              onCheckedChange={(checked) => setMakeDefault(checked === true)}
            />
            <div>
              <label className="cursor-pointer text-sm font-medium" htmlFor="create-address-default">Đặt làm địa chỉ mặc định</label>
              {firstAddress && <p className="mt-1 text-xs text-muted-foreground">Địa chỉ đầu tiên sẽ là địa chỉ mặc định.</p>}
            </div>
          </div>
          {formError && <p className="text-sm text-error" role="alert">{formError}</p>}
          <DialogFooter className="pt-2">
            <Button disabled={isSaving} onClick={onClose} type="button" variant="secondary">Hủy</Button>
            <Button disabled={isSaving} type="submit">{isSaving ? "Đang lưu..." : "Lưu địa chỉ"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
