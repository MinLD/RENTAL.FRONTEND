"use client";

import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteRenterAddress } from "@/services/renter-address-service";
import type { RenterAddress } from "@/types/renter-address";

export function AddressDeleteDialog({
  address,
  onChanged,
  onClose,
}: {
  address: RenterAddress;
  onChanged: () => Promise<unknown>;
  onClose: () => void;
}) {
  const mutation = useMutation({ mutationFn: () => deleteRenterAddress(address.id) });

  async function removeAddress() {
    if (mutation.isPending) return;
    try {
      await mutation.mutateAsync();
      await onChanged();
      onClose();
      toast.success("Đã xóa địa chỉ.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa địa chỉ.");
    }
  }

  return (
    <ConfirmDialog
      confirmLabel="Xóa địa chỉ"
      description="Địa chỉ này sẽ bị xóa khỏi sổ địa chỉ của bạn."
      icon={<Trash2 size={18} />}
      isSubmitting={mutation.isPending}
      onConfirm={() => void removeAddress()}
      onOpenChange={(open) => { if (!open) onClose(); }}
      open
      title="Xóa địa chỉ nhận hàng?"
      variant="danger"
    />
  );
}
