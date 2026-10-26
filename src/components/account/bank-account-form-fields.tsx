"use client";

import { Building2, CreditCard, User } from "lucide-react";

import { TextField } from "@/components/forms/text-field";
import type { CreateRenterBankAccountRequest } from "@/types/renter-bank-account";

export type BankAccountField = keyof CreateRenterBankAccountRequest;
export type BankAccountFieldErrors = Partial<Record<BankAccountField, string>>;

export const emptyBankAccount: CreateRenterBankAccountRequest = {
  bankCode: "",
  accountNumber: "",
  accountHolderName: "",
};

export function getBankAccountFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): BankAccountFieldErrors {
  return {
    bankCode: fieldErrors.bankCode?.[0],
    accountNumber: fieldErrors.accountNumber?.[0],
    accountHolderName: fieldErrors.accountHolderName?.[0],
  };
}

export function BankAccountFormFields({
  disabled,
  draft,
  errors,
  idPrefix,
  onChange,
}: {
  disabled: boolean;
  draft: CreateRenterBankAccountRequest;
  errors: BankAccountFieldErrors;
  idPrefix: string;
  onChange: (field: BankAccountField, value: string) => void;
}) {
  return (
    <>
      <TextField
        autoComplete="off"
        className="uppercase"
        disabled={disabled}
        error={errors.bankCode}
        id={`${idPrefix}-bank-code`}
        label="Mã ngân hàng"
        leftIcon={<Building2 size={16} />}
        maxLength={50}
        onBlur={() => onChange("bankCode", draft.bankCode.trim().toUpperCase())}
        onChange={(event) => onChange("bankCode", event.target.value)}
        placeholder="Ví dụ: VCB, MB, TCB..."
        required
        value={draft.bankCode}
      />
      <TextField
        autoComplete="off"
        disabled={disabled}
        error={errors.accountNumber}
        id={`${idPrefix}-account-number`}
        inputMode="numeric"
        label="Số tài khoản"
        leftIcon={<CreditCard size={16} />}
        maxLength={20}
        onChange={(event) =>
          onChange("accountNumber", event.target.value.replace(/\D/g, ""))
        }
        placeholder="Nhập 6–20 chữ số"
        required
        value={draft.accountNumber}
      />
      <TextField
        autoComplete="name"
        className="uppercase"
        disabled={disabled}
        error={errors.accountHolderName}
        id={`${idPrefix}-account-holder-name`}
        label="Tên chủ tài khoản"
        leftIcon={<User size={16} />}
        maxLength={100}
        onBlur={() =>
          onChange(
            "accountHolderName",
            draft.accountHolderName.trim().toUpperCase(),
          )
        }
        onChange={(event) => onChange("accountHolderName", event.target.value)}
        placeholder="Ví dụ: NGUYEN VAN A"
        required
        value={draft.accountHolderName}
      />
    </>
  );
}
