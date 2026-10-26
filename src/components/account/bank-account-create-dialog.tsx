"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  BankAccountFormFields,
  emptyBankAccount,
  getBankAccountFieldErrors,
  type BankAccountField,
  type BankAccountFieldErrors,
} from "@/components/account/bank-account-form-fields";
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
import { renterBankAccountSchema } from "@/lib/validations/renter-bank-account";
import {
  createRenterBankAccountAction,
  setDefaultRenterBankAccountAction,
} from "@/services/actions/renter-bank-account-actions";
import type { CreateRenterBankAccountRequest } from "@/types/renter-bank-account";

export function BankAccountCreateDialog({
  isFirstAccount,
  onChanged,
  onClose,
}: {
  isFirstAccount: boolean;
  onChanged: () => Promise<unknown>;
  onClose: () => void;
}) {
  const [firstAccount] = useState(isFirstAccount);
  const [draft, setDraft] =
    useState<CreateRenterBankAccountRequest>(emptyBankAccount);
  const [fieldErrors, setFieldErrors] = useState<BankAccountFieldErrors>({});
  const [makeDefault, setMakeDefault] = useState(firstAccount);
  const [isSaving, setIsSaving] = useState(false);

  function updateDraft(field: BankAccountField, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
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
      const result = await createRenterBankAccountAction(parsed.data);
      if (!result.success) {
        if (result.error.fieldErrors) {
          setFieldErrors(getBankAccountFieldErrors(result.error.fieldErrors));
        }
        throw new Error(result.error.message);
      }

      if (makeDefault && !firstAccount) {
        const defResult = await setDefaultRenterBankAccountAction(result.data.id);
        if (!defResult.success) {
          throw new Error(defResult.error.message);
        }
      }

      await onChanged();
      onClose();
      toast.success("Đã thêm tài khoản ngân hàng.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể thêm tài khoản ngân hàng.",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm tài khoản ngân hàng</DialogTitle>
          <DialogDescription>
            Tài khoản này dùng để nhận tiền hoàn cọc khi bạn thuê thiết bị.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <BankAccountFormFields
            disabled={isSaving}
            draft={draft}
            errors={fieldErrors}
            idPrefix="create-bank-account"
            onChange={updateDraft}
          />

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              checked={firstAccount || makeDefault}
              disabled={firstAccount || isSaving}
              id="create-bank-account-default"
              onCheckedChange={(checked) => setMakeDefault(Boolean(checked))}
            />
            <label
              className="cursor-pointer text-sm font-medium text-foreground"
              htmlFor="create-bank-account-default"
            >
              Đặt làm tài khoản mặc định
            </label>
          </div>

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
              {isSaving ? "Đang lưu..." : "Thêm tài khoản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
