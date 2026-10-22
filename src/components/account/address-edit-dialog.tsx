"use client";

import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  AddressFormFields,
  getAddressFieldErrors,
  type AddressField,
  type AddressFieldErrors,
} from "@/components/account/address-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { renterAddressSchema } from "@/lib/validations/renter-address";
import { updateRenterAddress } from "@/services/renter-address-service";
import type { RenterAddress, SaveRenterAddressRequest } from "@/types/renter-address";

export function AddressEditDialog({
  address,
  onChanged,
  onClose,
}: {
  address: RenterAddress;
  onChanged: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<SaveRenterAddressRequest>({
    province: address.province ?? "",
    addressDetail: address.addressDetail ?? "",
    recipientName: address.recipientName ?? "",
    recipientPhone: address.recipientPhone ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<AddressFieldErrors>({});
  const mutation = useMutation({
    mutationFn: (nextAddress: SaveRenterAddressRequest) => updateRenterAddress(address.id, nextAddress),
  });

  function updateDraft(field: AddressField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;

    const parsed = renterAddressSchema.safeParse(draft);
    if (!parsed.success) {
      setFieldErrors(getAddressFieldErrors(parsed.error.flatten().fieldErrors));
      return;
    }

    try {
      await mutation.mutateAsync(parsed.data);
      await onChanged();
      onClose();
      toast.success("Đã cập nhật địa chỉ.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật địa chỉ.");
    }
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }} open>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa địa chỉ nhận hàng</DialogTitle>
          <DialogDescription>Cập nhật địa chỉ đã lưu để sử dụng khi đặt hàng.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <AddressFormFields disabled={mutation.isPending} draft={draft} errors={fieldErrors} idPrefix="edit-address" onChange={updateDraft} />
          <DialogFooter className="pt-2">
            <Button disabled={mutation.isPending} onClick={onClose} type="button" variant="secondary">Hủy</Button>
            <Button disabled={mutation.isPending} type="submit">{mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
