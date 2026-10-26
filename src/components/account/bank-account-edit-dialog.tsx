"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  BankAccountFormFields,
  getBankAccountFieldErrors,
  type BankAccountField,
  type BankAccountFieldErrors,
} from "@/components/account/bank-account-form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { renterBankAccountSchema } from "@/lib/validations/renter-bank-account";
import { updateRenterBankAccountAction } from "@/services/actions/renter-bank-account-actions";
import type {
  RenterBankAccount,
  UpdateRenterBankAccountRequest,
} from "@/types/renter-bank-account";

export function BankAccountEditDialog({
  account,
  onChanged,
  onClose,
}: {
  account: RenterBankAccount;
  onChanged: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<UpdateRenterBankAccountRequest>({
    bankCode: account.bankCode ?? "",
    accountNumber: account.accountNumber ?? "",
    accountHolderName: account.accountHolderName ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<BankAccountFieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  function updateDraft(field: BankAccountField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const parsed = renterBankAccountSchema.safeParse(draft);
    if (!parsed.success) {
      setFieldErrors(
        getBankAccountFieldErrors(parsed.error.flatten().fieldErrors),
      );
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateRenterBankAccountAction(
        account.id,
        parsed.data,
      );
      if (!result.success) {
        if (result.error.fieldErrors) {
          setFieldErrors(getBankAccountFieldErrors(result.error.fieldErrors));
        }
        throw new Error(result.error.message);
      }

      await onChanged();
      onClose();
      toast.success("Đã cập nhật tài khoản ngân hàng.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật tài khoản ngân hàng.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open && !isSaving) onClose();
      }}
      open
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa tài khoản ngân hàng</DialogTitle>
          <DialogDescription>
            Sửa thông tin tài khoản trong sổ tài khoản của bạn.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <BankAccountFormFields
            disabled={isSaving}
            draft={draft}
            errors={fieldErrors}
            idPrefix="edit-bank-account"
            onChange={updateDraft}
          />

          <DialogFooter className="pt-2">
            <Button
              disabled={isSaving}
              onClick={onClose}
              type="button"
              variant="secondary"
            >
              Hủy
            </Button>
            <Button disabled={isSaving} type="submit">
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
