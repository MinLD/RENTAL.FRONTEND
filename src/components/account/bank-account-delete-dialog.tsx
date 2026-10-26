"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteRenterBankAccountAction } from "@/services/actions/renter-bank-account-actions";
import type { RenterBankAccount } from "@/types/renter-bank-account";

export function BankAccountDeleteDialog({
  account,
  onChanged,
  onClose,
}: {
  account: RenterBankAccount;
  onChanged: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function removeAccount() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteRenterBankAccountAction(account.id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      await onChanged();
      onClose();
      toast.success("Đã xóa tài khoản ngân hàng.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể xóa tài khoản ngân hàng.",
      );
    } finally {
      setIsDeleting(false);
    }
  }
  const accountLabel = [account.bankCode, account.accountNumber]
    .filter(Boolean)
    .join(" - ");

  return (
    <ConfirmDialog
      confirmLabel="Xóa tài khoản"
      description={`Tài khoản ${accountLabel || "này"} sẽ bị xóa khỏi sổ tài khoản. Các đơn đã đặt vẫn giữ tài khoản đã lưu lúc đặt.`}
      icon={<Trash2 size={18} />}
      isSubmitting={isDeleting}
      onConfirm={() => void removeAccount()}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      open
      title="Xóa tài khoản ngân hàng?"
      variant="danger"
    />
  );
}
