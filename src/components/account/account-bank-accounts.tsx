"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Landmark, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { BankAccountCreateDialog } from "@/components/account/bank-account-create-dialog";
import { BankAccountDeleteDialog } from "@/components/account/bank-account-delete-dialog";
import { BankAccountEditDialog } from "@/components/account/bank-account-edit-dialog";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { getRenterBankAccounts } from "@/services/renter-bank-account-service";
import { setDefaultRenterBankAccountAction } from "@/services/actions/renter-bank-account-actions";
import type { RenterBankAccount } from "@/types/renter-bank-account";

const MAX_BANK_ACCOUNTS = 10;


export function AccountBankAccounts({
  initialBankAccounts,
  initialError,
  userId,
}: {
  initialBankAccounts: RenterBankAccount[] | null;
  initialError: string | null;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["renter-bank-accounts", userId] as const;

  const accountsQuery = useQuery({
    queryKey,
    queryFn: getRenterBankAccounts,
    initialData: initialBankAccounts ?? undefined,
    refetchOnWindowFocus: false,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const accounts = accountsQuery.data;
  const loadError =
    accountsQuery.error instanceof Error && accountsQuery.error.message
      ? accountsQuery.error.message
      : accountsQuery.error
        ? "Không thể tải sổ tài khoản ngân hàng."
        : accounts === undefined
          ? initialError
          : null;

  const invalidateAccounts = () =>
    queryClient.invalidateQueries({ queryKey });

  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RenterBankAccount | null>(null);
  const [deleting, setDeleting] = useState<RenterBankAccount | null>(null);

  async function makeDefault(account: RenterBankAccount) {
    if (isSettingDefault || account.isDefault) return;
    setIsSettingDefault(true);
    try {
      const result = await setDefaultRenterBankAccountAction(account.id);
      if (!result.success) {
        throw new Error(result.error.message);
      }
      await invalidateAccounts();
      toast.success("Đã đặt làm tài khoản mặc định.");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Không thể đặt làm tài khoản mặc định.",
      );
    } finally {
      setIsSettingDefault(false);
    }
  }

  const orderedAccounts = [...(accounts ?? [])].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  );

  return (
    <section className="flex min-h-[400px] flex-col rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Tài khoản ngân hàng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lưu tài khoản ngân hàng để nhận hoàn tiền cọc khi thuê thiết bị.
          </p>
        </div>
        <Button
          disabled={
            isSettingDefault ||
            !accounts ||
            accounts.length >= MAX_BANK_ACCOUNTS
          }
          onClick={() => setCreating(true)}
          type="button"
        >
          <Plus size={16} /> Thêm tài khoản
        </Button>
      </div>

      {loadError ? (
        <ErrorState
          action={
            <Button
              disabled={accountsQuery.isFetching}
              onClick={() => void accountsQuery.refetch()}
              type="button"
            >
              {accountsQuery.isFetching ? "Đang thử lại..." : "Thử lại"}
            </Button>
          }
          className="flex-1 pb-4"
          description="Sổ tài khoản của bạn đang tạm thời không hiển thị. Vui lòng thử lại."
          title="Không tải được sổ tài khoản"
        />
      ) : accounts?.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <CreditCard aria-hidden="true" className="text-primary" size={27} />
          <h2 className="mt-4 font-semibold">
            Bạn chưa có tài khoản ngân hàng
          </h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Thêm tài khoản ngân hàng bằng nút phía trên để nhận hoàn tiền cọc tự
            động khi thuê thiết bị.
          </p>
        </div>
      ) : accounts ? (
        <div className="flex flex-col gap-3">
          {orderedAccounts.map((account) => (
            <article
              className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              key={account.id}
            >
              <div className="flex min-w-0 gap-3">
                <Landmark
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-primary"
                  size={20}
                />
                <div className="min-w-0 space-y-1 text-sm">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
                      {account.bankCode || "NGÂN HÀNG"}
                    </span>
                    <strong className="font-semibold text-foreground">
                      {account.accountNumber}
                    </strong>
                    {account.isDefault && (
                      <span className="text-xs font-semibold text-primary">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="font-medium uppercase tracking-wide text-muted-foreground">
                    {account.accountHolderName}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <Button
                  aria-label={`Sửa tài khoản ${account.accountNumber}`}
                  disabled={isSettingDefault}
                  onClick={() => setEditing(account)}
                  size="sm"
                  type="button"
                  variant="default"
                >
                  <Pencil size={14} /> Sửa
                </Button>
                {!account.isDefault && (
                  <Button
                    aria-label={`Đặt tài khoản ${account.accountNumber} làm mặc định`}
                    disabled={isSettingDefault}
                    onClick={() => void makeDefault(account)}
                    size="sm"
                    type="button"
                    variant="default"
                  >
                    <Star size={14} /> Đặt mặc định
                  </Button>
                )}
                <Button
                  aria-label={`Xóa tài khoản ${account.accountNumber}`}
                  className="text-error hover:text-error"
                  disabled={isSettingDefault}
                  onClick={() => setDeleting(account)}
                  size="sm"
                  type="button"
                  variant="default"
                >
                  <Trash2 size={14} /> Xóa
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {creating && (
        <BankAccountCreateDialog
          isFirstAccount={accounts?.length === 0}
          onChanged={invalidateAccounts}
          onClose={() => setCreating(false)}
        />
      )}
      {deleting && (
        <BankAccountDeleteDialog
          account={deleting}
          onChanged={invalidateAccounts}
          onClose={() => setDeleting(null)}
        />
      )}
      {editing && (
        <BankAccountEditDialog
          account={editing}
          onChanged={invalidateAccounts}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
