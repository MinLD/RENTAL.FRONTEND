"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AddressErrorIllustration } from "@/components/account/address-error-illustration";
import { AddressCreateDialog } from "@/components/account/address-create-dialog";
import { AddressDeleteDialog } from "@/components/account/address-delete-dialog";
import { AddressEditDialog } from "@/components/account/address-edit-dialog";
import { Button } from "@/components/ui/button";
import { getRenterAddresses, setDefaultRenterAddress } from "@/services/renter-address-service";
import type { RenterAddress } from "@/types/renter-address";

const MAX_ADDRESSES = 10;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function AccountAddressBook({
  initialAddresses,
  initialError,
  userId,
}: {
  initialAddresses: RenterAddress[] | null;
  initialError: string | null;
  userId: string;
}) {
  const queryClient = useQueryClient();
  const queryKey = ["renter-addresses", userId] as const;
  const addressesQuery = useQuery({
    queryKey,
    queryFn: getRenterAddresses,
    initialData: initialAddresses ?? undefined,
    staleTime: Infinity,
    retry: 1,
  });
  const addresses = addressesQuery.data;
  const loadError = addressesQuery.error
    ? errorMessage(addressesQuery.error, "Không thể tải sổ địa chỉ.")
    : addresses === undefined ? initialError : null;
  const invalidateAddresses = () => queryClient.invalidateQueries({ queryKey });
  const defaultMutation = useMutation({
    mutationFn: setDefaultRenterAddress,
    onSuccess: invalidateAddresses,
  });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RenterAddress | null>(null);
  const [deleting, setDeleting] = useState<RenterAddress | null>(null);

  async function makeDefault(address: RenterAddress) {
    if (defaultMutation.isPending || address.isDefault) return;
    try {
      await defaultMutation.mutateAsync(address.id);
      toast.success("Đã đặt làm địa chỉ mặc định.");
    } catch (error) {
      toast.error(errorMessage(error, "Không thể đặt địa chỉ mặc định."));
    }
  }

  const orderedAddresses = [...(addresses ?? [])].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  );

  return (
    <section className="flex min-h-[400px] flex-col rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Địa chỉ nhận hàng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lưu nơi giao thiết bị để chọn nhanh khi đặt hàng.
          </p>
        </div>
        <Button
          disabled={defaultMutation.isPending || !addresses || addresses.length >= MAX_ADDRESSES}
          onClick={() => setCreating(true)}
          type="button"
        >
          <Plus size={16} /> Thêm địa chỉ
        </Button>
      </div>

      {loadError ? (
        <div className="flex flex-1 flex-col items-center justify-center pb-4 text-center" role="alert">
          <div className="w-48 max-w-full"><AddressErrorIllustration /></div>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Không tải được sổ địa chỉ</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Địa chỉ của bạn đang tạm thời không hiển thị. Vui lòng thử lại.
          </p>
          <Button
            className="mt-5"
            disabled={addressesQuery.isFetching}
            onClick={() => void addressesQuery.refetch()}
            type="button"
          >
            {addressesQuery.isFetching ? "Đang thử lại..." : "Thử lại"}
          </Button>
        </div>
      ) : addresses?.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <MapPin aria-hidden="true" className="text-primary" size={27} />
          <h2 className="mt-4 font-semibold">Bạn chưa có địa chỉ nhận hàng</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Thêm địa chỉ bằng nút phía trên để chọn nhanh khi đặt thuê thiết bị.
          </p>
        </div>
      ) : addresses ? (
        <div className="max-h-[280px] overflow-y-auto overscroll-contain">
          {orderedAddresses.map((address) => (
            <article className="flex flex-col gap-4 py-5 sm:flex-row sm:justify-between" key={address.id}>
              <div className="flex min-w-0 gap-3">
                <MapPin aria-hidden="true" className="mt-0.5 shrink-0 text-primary" size={17} />
                <div className="min-w-0 space-y-1.5 text-sm">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <strong className="font-semibold text-foreground">{address.recipientName}</strong>
                    <span className="text-muted-foreground">{address.recipientPhone}</span>
                    {address.isDefault && <span className="text-xs font-semibold text-primary">Mặc định</span>}
                  </div>
                  <p className="break-words text-foreground">{address.addressDetail}, {address.province}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-start gap-1 sm:justify-end">
                {!address.isDefault && (
                  <Button
                    aria-label={`Đặt địa chỉ của ${address.recipientName} làm mặc định`}
                    disabled={defaultMutation.isPending}
                    onClick={() => void makeDefault(address)}
                    size="sm"
                    type="button"
                    variant="default"
                  >
                    <Star size={14} /> Đặt mặc định
                  </Button>
                )}
                <Button
                  aria-label={`Sửa địa chỉ của ${address.recipientName}`}
                  disabled={defaultMutation.isPending}
                  onClick={() => setEditing(address)}
                  size="sm"
                  type="button"
                  variant="default"
                >
                  <Pencil size={14} /> Sửa
                </Button>
                <Button
                  aria-label={`Xóa địa chỉ của ${address.recipientName}`}
                  className="text-error hover:text-error"
                  disabled={defaultMutation.isPending}
                  onClick={() => setDeleting(address)}
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
        <AddressCreateDialog
          isFirstAddress={addresses?.length === 0}
          onChanged={invalidateAddresses}
          onClose={() => setCreating(false)}
        />
      )}
      {editing && (
        <AddressEditDialog
          address={editing}
          onChanged={invalidateAddresses}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <AddressDeleteDialog
          address={deleting}
          onChanged={invalidateAddresses}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  );
}
