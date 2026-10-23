"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { AddressCreateDialog } from "@/components/account/address-create-dialog";
import { AddressDeleteDialog } from "@/components/account/address-delete-dialog";
import { AddressEditDialog } from "@/components/account/address-edit-dialog";
import { ErrorState } from "@/components/error-state";
import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  buyNowCheckoutSchema,
  type BuyNowCheckoutValues,
} from "@/lib/validations/checkout";
import { getRenterAddresses } from "@/services/renter-address-service";
import {
  getCheckoutOperation,
  submitBuyNowCheckout,
} from "@/services/checkout-service";
import { getRenterOrders } from "@/services/renter-order-service";
import { ApiError } from "@/services/api-error";
import type {
  BuyNowSelection,
  CheckoutRequest,
  RenterOrderSummary,
} from "@/types/checkout";
import type { PublicEquipmentListingDetail } from "@/types/inventory";
import type { RenterAddress } from "@/types/renter-address";
import {
  formatEquipmentListingRate,
  getEquipmentListingName,
} from "@/utils/inventory";
import { formatRentalDate, getRentalDayCount } from "@/utils/product-detail";
import type { RentalPriceEstimate } from "@/utils/rental-pricing";
import {
  clearCheckoutAttempt,
  getCheckoutIdempotencyKey,
  rememberCheckoutAttempt,
  type CheckoutIdempotencyAttempt,
} from "@/utils/checkout-idempotency";

const MAX_ADDRESSES = 10;
const CHECKOUT_POLL_INTERVAL_MS = 2_000;

function normalizedOperationStatus(value: string | null | undefined) {
  return value?.toUpperCase().replaceAll("-", "_") ?? "";
}

function isCheckoutOperationFailed(status: string | null | undefined) {
  return ["FAILED", "REJECTED", "CANCELLED"].includes(
    normalizedOperationStatus(status),
  );
}

export function BuyNowCheckout({
  addresses: initialAddresses,
  addressesError,
  depositAmount,
  estimate,
  profileCompleted,
  profileHref,
  product,
  selection,
  termsVersion,
  userId,
}: {
  addresses: RenterAddress[] | null;
  addressesError: string | null;
  depositAmount: number;
  estimate: RentalPriceEstimate;
  profileCompleted: boolean;
  profileHref: string;
  product: PublicEquipmentListingDetail;
  selection: BuyNowSelection;
  termsVersion?: string;
  userId: string;
}) {
  const router = useRouter();
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
  const initialDefault =
    initialAddresses?.find((address) => address.isDefault) ??
    initialAddresses?.[0];
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<RenterAddress | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<RenterAddress | null>(null);
  const [pendingOrder, setPendingOrder] = useState<RenterOrderSummary | null>(
    null,
  );
  const [operationId, setOperationId] = useState<string | null>(null);
  const idempotency = useRef<CheckoutIdempotencyAttempt | null>(null);
  const mutation = useMutation({
    mutationFn: async (request: CheckoutRequest) => {
      const attempt = await getCheckoutIdempotencyKey(
        request,
        idempotency.current,
      );
      idempotency.current = attempt;
      return submitBuyNowCheckout(request, attempt.key);
    },
  });
  const operationQuery = useQuery({
    queryKey: ["checkout-operation", operationId],
    queryFn: () => getCheckoutOperation(operationId!),
    enabled: Boolean(operationId),
    refetchInterval: (current) => {
      const operation = current.state.data;
      return isCheckoutOperationFailed(operation?.status) ||
        (normalizedOperationStatus(operation?.status) === "SUCCEEDED" &&
          operation?.orderId)
        ? false
        : CHECKOUT_POLL_INTERVAL_MS;
    },
    retry: 1,
  });
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<BuyNowCheckoutValues>({
    resolver: zodResolver(buyNowCheckoutSchema),
    defaultValues: {
      addressId: initialDefault?.id ?? "",
      deliveryNote: "",
      bankCode: "",
      accountNumber: "",
      accountHolderName: "",
      termsAccepted: false,
    },
  });
  const selectedAddressId = useWatch({ control, name: "addressId" });
  const orderedAddresses = [...(addresses ?? [])].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  );
  const name = getEquipmentListingName(product);
  const currency = product.rentalRate?.currency ?? "VND";
  const totalAmount = estimate.total + depositAmount;
  const price = (value: number) => formatEquipmentListingRate(value, currency);
  const addressLoadError = addressesQuery.error
    ? "Không thể tải địa chỉ nhận hàng."
    : addresses === undefined
      ? addressesError
      : null;
  const operation = operationQuery.data;
  const operationFailed = isCheckoutOperationFailed(operation?.status);
  const operationSucceeded =
    normalizedOperationStatus(operation?.status) === "SUCCEEDED" &&
    Boolean(operation?.orderId);

  useEffect(() => {
    if (operationSucceeded && operation?.orderId) {
      router.replace(`/orders/${encodeURIComponent(operation.orderId)}`);
    }
  }, [operation?.orderId, operationSucceeded, router]);

  useEffect(() => {
    if (addresses && !addresses.some((address) => address.id === selectedAddressId)) {
      const nextAddressId = addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? "";
      if (nextAddressId !== selectedAddressId) {
        setValue("addressId", nextAddressId, { shouldValidate: true });
      }
    }
  }, [addresses, selectedAddressId, setValue]);

  const addressActionsDisabled = mutation.isPending || Boolean(operationId);
  const invalidateAddresses = () => queryClient.invalidateQueries({ queryKey });

  async function submit(values: BuyNowCheckoutValues) {
    if (mutation.isPending) return;
    if (!profileCompleted) {
      toast.error("Vui lòng hoàn thiện hồ sơ người thuê trước khi gửi đơn.");
      return;
    }
    if (addressesQuery.isError || !addresses?.some((address) => address.id === values.addressId)) {
      setError("addressId", { message: "Vui lòng chọn địa chỉ nhận thiết bị hợp lệ." });
      return;
    }
    const request: CheckoutRequest = {
      buyNow: selection,
      addressId: values.addressId,
      deliveryNote: values.deliveryNote || undefined,
      refundAccount: {
        bankCode: values.bankCode,
        accountNumber: values.accountNumber,
        accountHolderName: values.accountHolderName,
      },
      expectedTotalAmount: totalAmount,
      termsAccepted: true,
      ...(termsVersion ? { termsVersion } : {}),
    };
    try {
      const result = await mutation.mutateAsync(request);
      rememberCheckoutAttempt(
        result.id,
        idempotency.current?.storageKey ?? null,
      );
      if (result.kind === "operation") {
        setOperationId(result.id);
      } else {
        router.push(`/orders/${encodeURIComponent(result.id)}`);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        try {
          const orders = await getRenterOrders("PENDING_PAYMENT");
          const existing = orders.items?.find(
            (order) => order.status === "PENDING_PAYMENT",
          );
          if (existing) {
            setPendingOrder(existing);
            toast.error(
              "Bạn đã có đơn đang chờ thanh toán. Hãy thanh toán đơn đó trước khi đặt tiếp.",
            );
            return;
          }
        } catch {
          // Preserve the original checkout conflict if the order list is unavailable.
        }
        toast.error(
          error.message ||
            "Đơn chưa thể gửi do trạng thái hoặc giá đã thay đổi. Vui lòng kiểm tra lại.",
        );
        router.refresh();
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không thể gửi đơn thuê. Vui lòng thử lại.",
        );
      }
    }
  }


  return (
    <div className="flex-1 bg-[#f5f7fa] py-6 sm:py-8">
      <Container>
        <nav
          aria-label="Đường dẫn thanh toán"
          className="mb-5 flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link className="hover:text-primary" href={`/products/${product.id}`}>
            Chi tiết thiết bị
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">
            Xác nhận thuê ngay
          </span>
        </nav>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Xác nhận đơn thuê</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kiểm tra thông tin trước khi gửi đơn và thanh toán.
          </p>
        </div>

        {!profileCompleted && (
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background p-4"
            role="status"
          >
            <div>
              <p className="font-semibold">Cần hoàn thiện hồ sơ người thuê</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Bạn vẫn có thể xem lại đơn thuê. Hoàn thiện hồ sơ rồi quay lại
                để gửi đơn.
              </p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href={profileHref}>Hoàn thiện hồ sơ</Link>
            </Button>
          </div>
        )}

        {pendingOrder && (
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background p-4"
            role="alert"
          >
            <div>
              <p className="font-semibold">Bạn có đơn đang chờ thanh toán</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Đơn {pendingOrder.orderCode ?? pendingOrder.orderId} cần được
                thanh toán trước khi tạo đơn mới.
              </p>
            </div>
            <Button asChild size="sm">
              <Link
                href={`/orders/${encodeURIComponent(pendingOrder.orderId)}`}
              >
                Tiếp tục thanh toán
              </Link>
            </Button>
          </div>
        )}

        {operationId && (
          <div
            className="mb-5 rounded-lg border border-border bg-background p-5 shadow-sm"
            role={
              operationFailed || operationQuery.isError ? "alert" : "status"
            }
          >
            {operationFailed ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Không thể tạo đơn thuê</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {operation?.errorMessage ||
                      "Đơn chưa được tạo. Bạn có thể kiểm tra lại thông tin và thử gửi đơn lần nữa."}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    clearCheckoutAttempt(operationId);
                    idempotency.current = null;
                    setOperationId(null);
                    mutation.reset();
                  }}
                  type="button"
                >
                  Thử gửi lại
                </Button>
              </div>
            ) : operationQuery.isError && !operation ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    Chưa kiểm tra được trạng thái gửi đơn
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Giữ nguyên trang này và thử kiểm tra lại để tránh tạo đơn
                    trùng.
                  </p>
                </div>
                <Button
                  disabled={operationQuery.isFetching}
                  onClick={() => void operationQuery.refetch()}
                  type="button"
                  variant="secondary"
                >
                  Kiểm tra lại
                </Button>
              </div>
            ) : (
              <p className="font-medium">
                Đơn đang được xử lý. Trang sẽ tự mở chi tiết đơn khi hoàn tất.
              </p>
            )}
          </div>
        )}

        <form
          className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"
          onSubmit={(event) => void handleSubmit(submit)(event)}
        >
          <div className="space-y-5">
            <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Địa chỉ nhận thiết bị
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chọn địa chỉ nhận thiết bị từ sổ địa chỉ của bạn.
                  </p>
                </div>
                <Button
                  disabled={addressActionsDisabled || !addresses || addressesQuery.isError || addresses.length >= MAX_ADDRESSES}
                  onClick={() => setCreatingAddress(true)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Plus className="size-4" /> Thêm địa chỉ
                </Button>
              </div>
              {addressLoadError ? (
                <ErrorState
                  action={
                    <Button
                      disabled={addressesQuery.isFetching}
                      onClick={() => void addressesQuery.refetch()}
                      size="sm"
                      type="button"
                    >
                      Thử lại
                    </Button>
                  }
                  className="min-h-56"
                  description="Vui lòng thử lại để chọn nơi giao thiết bị."
                  title="Không thể tải địa chỉ"
                />
              ) : addresses?.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Bạn chưa có địa chỉ nhận hàng. Hãy thêm địa chỉ để tiếp tục.
                </p>
              ) : addresses ? (
                <Controller
                  control={control}
                  name="addressId"
                  render={({ field }) => (
                    <RadioGroup
                      aria-label="Địa chỉ nhận thiết bị"
                      disabled={addressActionsDisabled}
                      className="mt-4 max-h-72 overflow-y-auto"
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      {orderedAddresses.map((address) => (
                        <div
                          className="flex flex-col gap-2 rounded border border-border p-3 data-[selected=true]:border-primary sm:flex-row sm:items-start sm:gap-3"
                          data-selected={field.value === address.id}
                          key={address.id}
                        >
                          <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3" htmlFor={`checkout-address-${address.id}`}>
                            <RadioGroupItem
                              aria-label={`Chọn địa chỉ của ${address.recipientName}`}
                              className="mt-1"
                              id={`checkout-address-${address.id}`}
                              value={address.id}
                            />
                            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span className="min-w-0 text-sm">
                              <span className="flex flex-wrap gap-x-2">
                                <strong>{address.recipientName}</strong>
                                <span className="text-muted-foreground">{address.recipientPhone}</span>
                                {address.isDefault && <span className="text-xs text-primary">Mặc định</span>}
                              </span>
                              <span className="mt-1 block break-words">{address.addressDetail}, {address.province}</span>
                            </span>
                          </label>
                          <div className="flex shrink-0 justify-end gap-1">
                            <Button
                              aria-label={`Sửa địa chỉ của ${address.recipientName}`}
                              disabled={addressActionsDisabled}
                              onClick={() => setEditingAddress(address)}
                              size="sm"
                              type="button"
                              variant="default"
                            ><Pencil aria-hidden="true" className="size-3.5" /> Sửa</Button>
                            <Button
                              aria-label={`Xóa địa chỉ của ${address.recipientName}`}
                              className="text-error hover:text-error"
                              disabled={addressActionsDisabled}
                              onClick={() => setDeletingAddress(address)}
                              size="sm"
                              type="button"
                              variant="default"
                            ><Trash2 aria-hidden="true" className="size-3.5" /> Xóa</Button>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
              ) : null}
              {errors.addressId && (
                <p className="mt-2 text-xs text-error" role="alert">
                  {errors.addressId.message}
                </p>
              )}
              <div className="mt-4">
                <label
                  className="mb-2 block text-sm font-medium"
                  htmlFor="checkout-delivery-note"
                >
                  Ghi chú giao hàng
                </label>
                <Textarea
                  id="checkout-delivery-note"
                  maxLength={500}
                  placeholder="Ví dụ: Gọi trước khi giao thiết bị"
                  {...register("deliveryNote")}
                />
                {errors.deliveryNote && (
                  <p className="mt-1 text-xs text-error" role="alert">
                    {errors.deliveryNote.message}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold">
                Tài khoản nhận hoàn tiền
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Dùng khi đơn có khoản cần hoàn trả.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    htmlFor="checkout-bank-code"
                  >
                    Mã ngân hàng
                  </label>
                  <Input
                    autoComplete="off"
                    id="checkout-bank-code"
                    placeholder="Ví dụ: VCB"
                    {...register("bankCode")}
                  />
                  {errors.bankCode && (
                    <p className="mt-1 text-xs text-error" role="alert">
                      {errors.bankCode.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    htmlFor="checkout-account-number"
                  >
                    Số tài khoản
                  </label>
                  <Input
                    autoComplete="off"
                    id="checkout-account-number"
                    inputMode="numeric"
                    placeholder="Nhập số tài khoản"
                    {...register("accountNumber")}
                  />
                  {errors.accountNumber && (
                    <p className="mt-1 text-xs text-error" role="alert">
                      {errors.accountNumber.message}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label
                    className="mb-2 block text-sm font-medium"
                    htmlFor="checkout-account-holder"
                  >
                    Tên chủ tài khoản
                  </label>
                  <Input
                    autoComplete="name"
                    id="checkout-account-holder"
                    placeholder="Tên như trên tài khoản ngân hàng"
                    {...register("accountHolderName")}
                  />
                  {errors.accountHolderName && (
                    <p className="mt-1 text-xs text-error" role="alert">
                      {errors.accountHolderName.message}
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">Thông tin đơn thuê</h2>
            <div className="mt-4 flex gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded border border-border">
                <ProductImage
                  compact
                  name={name}
                  role="thumbnail"
                  sizes="80px"
                  src={product.thumbnailUrl}
                />
              </div>
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selection.quantity} thiết bị ·{" "}
                  {getRentalDayCount(
                    selection.expectedStartDate,
                    selection.expectedEndDate,
                  )}{" "}
                  ngày
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRentalDate(selection.expectedStartDate)} –{" "}
                  {formatRentalDate(selection.expectedEndDate)}
                </p>
              </div>
            </div>
            <Separator className="my-5" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tiền thuê</dt>
                <dd>{price(estimate.total)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tiền cọc</dt>
                <dd>{price(depositAmount)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-3 font-semibold">
                <dt>Tổng dự kiến</dt>
                <dd className="text-lg text-primary">{price(totalAmount)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Hệ thống sẽ kiểm tra lại giá và số lượng khi bạn gửi đơn.
            </p>
            <Controller
              control={control}
              name="termsAccepted"
              render={({ field }) => (
                <div className="mt-5 flex items-start gap-2">
                  <Checkbox
                    checked={field.value}
                    className="mt-0.5"
                    id="checkout-terms"
                    onBlur={field.onBlur}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    ref={field.ref}
                  />
                  <label
                    className="cursor-pointer text-sm leading-5"
                    htmlFor="checkout-terms"
                  >
                    Tôi đã đọc và đồng ý với điều khoản thuê thiết bị.
                  </label>
                </div>
              )}
            />
            {errors.termsAccepted && (
              <p className="mt-1 text-xs text-error" role="alert">
                {errors.termsAccepted.message}
              </p>
            )}
            <Button
              className="mt-5 w-full"
              disabled={
                !profileCompleted ||
                mutation.isPending ||
                Boolean(operationId) ||
                addressesQuery.isError ||
                !addresses?.length
              }
              type="submit"
            >
              {mutation.isPending || operationId
                ? "Đang gửi đơn..."
                : profileCompleted
                  ? "Gửi đơn và thanh toán"
                  : "Hoàn thiện hồ sơ để tiếp tục"}
            </Button>
            <Button asChild className="mt-2 w-full" variant="default">
              <Link href={`/products/${product.id}`}>
                <ArrowLeft className="size-4" /> Quay lại thiết bị
              </Link>
            </Button>
          </aside>
        </form>
      </Container>
      {creatingAddress && (
        <AddressCreateDialog
          isFirstAddress={addresses?.length === 0}
          onChanged={async () => {
            await invalidateAddresses();
            const nextAddresses = queryClient.getQueryData<RenterAddress[]>(queryKey);
            const created = nextAddresses?.find((address) => !addresses?.some((previous) => previous.id === address.id));
            if (created) setValue("addressId", created.id, { shouldValidate: true });
          }}
          onClose={() => setCreatingAddress(false)}
        />
      )}
      {editingAddress && (
        <AddressEditDialog address={editingAddress} onChanged={invalidateAddresses} onClose={() => setEditingAddress(null)} />
      )}
      {deletingAddress && (
        <AddressDeleteDialog address={deletingAddress} onChanged={invalidateAddresses} onClose={() => setDeletingAddress(null)} />
      )}
    </div>
  );
}
