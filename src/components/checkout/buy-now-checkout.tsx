"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Landmark, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { AddressCreateDialog } from "@/components/account/address-create-dialog";
import { AddressDeleteDialog } from "@/components/account/address-delete-dialog";
import { AddressEditDialog } from "@/components/account/address-edit-dialog";
import { BankAccountCreateDialog } from "@/components/account/bank-account-create-dialog";
import { BankAccountDeleteDialog } from "@/components/account/bank-account-delete-dialog";
import { BankAccountEditDialog } from "@/components/account/bank-account-edit-dialog";
import { ErrorState } from "@/components/error-state";
import { Container } from "@/components/layout/container";
import { ProductImage } from "@/components/products/product-image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  buyNowCheckoutSchema,
  type BuyNowCheckoutValues,
} from "@/lib/validations/checkout";
import { getRenterAddresses } from "@/services/renter-address-service";
import { getRenterBankAccounts } from "@/services/renter-bank-account-service";
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
import type { CartItem } from "@/types/cart";
import type { PublicEquipmentListingDetail } from "@/types/inventory";
import type { RenterAddress } from "@/types/renter-address";
import type { RenterBankAccount } from "@/types/renter-bank-account";
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
const MAX_BANK_ACCOUNTS = 10;
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
  bankAccounts: initialBankAccounts,
  bankAccountsError,
  depositAmount,
  estimate,
  profileCompleted,
  profileHref,
  product,
  selection,
  termsVersion,
  userId,
  cartItems,
}: {
  addresses: RenterAddress[] | null;
  addressesError: string | null;
  bankAccounts: RenterBankAccount[] | null;
  bankAccountsError: string | null;
  depositAmount?: number;
  estimate?: RentalPriceEstimate;
  profileCompleted: boolean;
  profileHref: string;
  product?: PublicEquipmentListingDetail;
  selection?: BuyNowSelection;
  termsVersion?: string;
  userId: string;
  cartItems?: CartItem[];
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

  const bankAccountsQueryKey = ["renter-bank-accounts", userId] as const;
  const bankAccountsQuery = useQuery({
    queryKey: bankAccountsQueryKey,
    queryFn: getRenterBankAccounts,
    initialData: initialBankAccounts ?? undefined,
    staleTime: Infinity,
    retry: 1,
  });
  const bankAccounts = bankAccountsQuery.data;
  const initialDefaultBank =
    initialBankAccounts?.find((account) => account.isDefault) ??
    initialBankAccounts?.[0];

  const [creatingAddress, setCreatingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<RenterAddress | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<RenterAddress | null>(null);
  const [creatingBankAccount, setCreatingBankAccount] = useState(false);
  const [deletingBankAccount, setDeletingBankAccount] =
    useState<RenterBankAccount | null>(null);
  const [editingBankAccount, setEditingBankAccount] =
    useState<RenterBankAccount | null>(null);
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
      console.log(
        "[Checkout] 🚀 Sending API POST /api/v1/rental/checkout",
        "\n• Idempotency-Key:", attempt.key,
        "\n• Request Body:", request,
      );
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
      bankAccountId: initialDefaultBank?.id ?? "",
      termsAccepted: false,
    },
  });
  const selectedAddressId = useWatch({ control, name: "addressId" });
  const selectedBankAccountId = useWatch({ control, name: "bankAccountId" });
  const orderedAddresses = [...(addresses ?? [])].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  );
  const orderedBankAccounts = [...(bankAccounts ?? [])].sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault),
  );
  const isCartMode = Boolean(cartItems && cartItems.length > 0);
  const name = isCartMode
    ? `Đơn hàng (${cartItems!.length} thiết bị)`
    : product ? getEquipmentListingName(product) : "Thiết bị thuê";
  const currency = isCartMode
    ? cartItems![0]?.currency || "VND"
    : product?.rentalRate?.currency ?? "VND";
  const effectiveRentalTotal = isCartMode
    ? cartItems!.reduce((sum, item) => sum + (item.estimatedRentalAmount ?? 0), 0)
    : (estimate?.total ?? 0);
  const effectiveDepositTotal = isCartMode
    ? cartItems!.reduce((sum, item) => sum + ((item.currentDeposit ?? 0) * item.quantity), 0)
    : (depositAmount ?? 0);
  const totalAmount = effectiveRentalTotal + effectiveDepositTotal;
  const price = (value: number) => formatEquipmentListingRate(value, currency);
  const addressLoadError = addressesQuery.error
    ? "Không thể tải địa chỉ nhận hàng."
    : addresses === undefined
      ? addressesError
      : null;
  const bankAccountsLoadError = bankAccountsQuery.error
    ? "Không thể tải tài khoản ngân hàng."
    : bankAccounts === undefined
      ? bankAccountsError
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

  useEffect(() => {
    if (
      bankAccounts &&
      !bankAccounts.some((account) => account.id === selectedBankAccountId)
    ) {
      const nextBankAccountId =
        bankAccounts.find((account) => account.isDefault)?.id ??
        bankAccounts[0]?.id ??
        "";
      if (nextBankAccountId !== selectedBankAccountId) {
        setValue("bankAccountId", nextBankAccountId, { shouldValidate: true });
      }
    }
  }, [bankAccounts, selectedBankAccountId, setValue]);

  const addressActionsDisabled = mutation.isPending || Boolean(operationId);
  const invalidateAddresses = () => queryClient.invalidateQueries({ queryKey });
  const invalidateBankAccounts = () =>
    queryClient.invalidateQueries({ queryKey: bankAccountsQueryKey });
  async function submit(values: BuyNowCheckoutValues) {
    console.log("[Checkout] 👉 Submit button clicked. Form values:", values);
    if (mutation.isPending) {
      console.warn("[Checkout] ⚠️ Blocked: mutation.isPending is true");
      return;
    }
    if (!profileCompleted) {
      console.warn("[Checkout] ⚠️ Blocked: profileCompleted is false");
      toast.error("Vui lòng hoàn thiện hồ sơ người thuê trước khi gửi đơn.");
      return;
    }
    if (addressesQuery.isError || !addresses?.some((address) => address.id === values.addressId)) {
      console.warn("[Checkout] ⚠️ Blocked: addressId is invalid or not in addresses list:", values.addressId);
      setError("addressId", { message: "Vui lòng chọn địa chỉ nhận thiết bị hợp lệ." });
      return;
    }
    if (
      bankAccountsQuery.isError ||
      !bankAccounts?.some((account) => account.id === values.bankAccountId)
    ) {
      console.warn("[Checkout] ⚠️ Blocked: bankAccountId is invalid or not in bankAccounts list:", values.bankAccountId);
      setError("bankAccountId", {
        message: "Vui lòng chọn tài khoản nhận hoàn tiền hợp lệ.",
      });
      return;
    }
    const selectedBank = bankAccounts?.find(
      (account) => account.id === values.bankAccountId,
    );
    if (
      !selectedBank?.bankCode ||
      !selectedBank?.accountNumber ||
      !selectedBank?.accountHolderName
    ) {
      console.warn("[Checkout] ⚠️ Blocked: selectedBank missing required fields:", selectedBank);
      setError("bankAccountId", {
        message: "Tài khoản nhận hoàn tiền đã chọn thiếu thông tin hợp lệ.",
      });
      return;
    }
    const request: CheckoutRequest = {
      ...(isCartMode
        ? { cartItemIds: cartItems!.map((i) => i.cartItemId) }
        : selection ? { buyNow: selection } : {}),
      addressId: values.addressId,
      deliveryNote: values.deliveryNote || undefined,
      refundAccount: {
        bankCode: selectedBank.bankCode,
        accountNumber: selectedBank.accountNumber,
        accountHolderName: selectedBank.accountHolderName,
      },
      expectedTotalAmount: totalAmount,
      termsAccepted: true,
      ...(termsVersion ? { termsVersion } : {}),
    };
    console.log("[Checkout] 📦 Prepared request payload:", request);
    try {
      const result = await mutation.mutateAsync(request);
      console.log("[Checkout] ✅ API response result:", result);
      rememberCheckoutAttempt(
        result.id,
        idempotency.current?.storageKey ?? null,
      );
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (result.kind === "operation") {
        setOperationId(result.id);
      } else {
        router.push(`/orders/${encodeURIComponent(result.id)}`);
      }
    } catch (error) {
      console.error("[Checkout] ❌ API call failed with error:", error);
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
          <Link className="hover:text-primary" href={product ? `/products/${product.id}` : "/cart"}>
            {product ? "Chi tiết thiết bị" : "Giỏ hàng"}
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">
            {isCartMode ? "Xác nhận đặt thuê giỏ hàng" : "Xác nhận thuê ngay"}
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
          onSubmit={(event) =>
            void handleSubmit(
              submit,
              (formErrors) => {
                console.warn("[Checkout] ⚠️ Form validation failed (React Hook Form). Errors:", formErrors);
                toast.error("Vui lòng kiểm tra lại các thông tin bắt buộc hoặc tích chọn đồng ý điều khoản.");
              },
            )(event)
          }
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Tài khoản nhận hoàn tiền
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chọn tài khoản nhận tiền hoàn trả từ sổ tài khoản của bạn.
                  </p>
                </div>
                <Button
                  disabled={
                    addressActionsDisabled ||
                    !bankAccounts ||
                    bankAccountsQuery.isError ||
                    bankAccounts.length >= MAX_BANK_ACCOUNTS
                  }
                  onClick={() => setCreatingBankAccount(true)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  <Plus className="size-4" /> Thêm tài khoản
                </Button>
              </div>
              {bankAccountsLoadError ? (
                <ErrorState
                  action={
                    <Button
                      disabled={bankAccountsQuery.isFetching}
                      onClick={() => void bankAccountsQuery.refetch()}
                      size="sm"
                      type="button"
                    >
                      Thử lại
                    </Button>
                  }
                  className="min-h-56"
                  description="Vui lòng thử lại để chọn tài khoản nhận tiền hoàn trả."
                  title="Không thể tải tài khoản ngân hàng"
                />
              ) : bankAccounts?.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Bạn chưa có tài khoản ngân hàng. Hãy thêm tài khoản để tiếp tục nhận hoàn tiền khi cần.
                </p>
              ) : bankAccounts ? (
                <Controller
                  control={control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <RadioGroup
                      aria-label="Tài khoản nhận hoàn tiền"
                      className="mt-4 max-h-72 overflow-y-auto"
                      disabled={addressActionsDisabled}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      {orderedBankAccounts.map((account) => (
                        <div
                          className="flex flex-col gap-2 rounded border border-border p-3 data-[selected=true]:border-primary sm:flex-row sm:items-start sm:gap-3"
                          data-selected={field.value === account.id}
                          key={account.id}
                        >
                          <label
                            className="flex min-w-0 flex-1 cursor-pointer items-start gap-3"
                            htmlFor={`checkout-bank-account-${account.id}`}
                          >
                            <RadioGroupItem
                              aria-label={`Chọn tài khoản ${account.bankCode ?? ""} của ${account.accountHolderName ?? ""}`}
                              className="mt-1"
                              id={`checkout-bank-account-${account.id}`}
                              value={account.id}
                            />
                            <Landmark
                              aria-hidden="true"
                              className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            <span className="min-w-0 text-sm">
                              <span className="flex flex-wrap items-center gap-x-2">
                                <strong>{account.bankCode || "Ngân hàng"}</strong>
                                <span className="font-mono text-muted-foreground">
                                  {account.accountNumber}
                                </span>
                                {account.isDefault && (
                                  <span className="text-xs text-primary">
                                    Mặc định
                                  </span>
                                )}
                              </span>
                              <span className="mt-1 block font-medium uppercase text-muted-foreground">
                                {account.accountHolderName}
                              </span>
                            </span>
                          </label>
                          <div className="flex shrink-0 justify-end gap-1">
                            <Button
                              aria-label={`Sửa tài khoản ${account.bankCode ?? ""} của ${account.accountHolderName ?? ""}`}
                              disabled={addressActionsDisabled}
                              onClick={() => setEditingBankAccount(account)}
                              size="sm"
                              type="button"
                              variant="default"
                            >
                              <Pencil aria-hidden="true" className="size-3.5" /> Sửa
                            </Button>
                            <Button
                              aria-label={`Xóa tài khoản ${account.bankCode ?? ""} của ${account.accountHolderName ?? ""}`}
                              className="text-error hover:text-error"
                              disabled={addressActionsDisabled}
                              onClick={() => setDeletingBankAccount(account)}
                              size="sm"
                              type="button"
                              variant="default"
                            >
                              <Trash2 aria-hidden="true" className="size-3.5" /> Xóa
                            </Button>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                />
              ) : null}
              {errors.bankAccountId && (
                <p className="mt-2 text-xs text-error" role="alert">
                  {errors.bankAccountId.message}
                </p>
              )}
            </section>
          </div>

          <aside className="rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-semibold">Thông tin đơn thuê</h2>
            {isCartMode ? (
              <div className="mt-4 max-h-72 divide-y divide-border/60 overflow-y-auto pr-1">
                {cartItems!.map((item) => (
                  <div key={item.cartItemId} className="flex gap-3 py-2.5 first:pt-0">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded border border-border bg-muted">
                      <ProductImage
                        compact
                        name={item.name}
                        role="thumbnail"
                        sizes="56px"
                        src={item.thumbnailUrl}
                      />
                    </div>
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="font-semibold line-clamp-1">{item.name}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {item.quantity} thiết bị · {getRentalDayCount(item.expectedStartDate, item.expectedEndDate)} ngày
                      </p>
                      <p className="text-muted-foreground">
                        {formatRentalDate(item.expectedStartDate)} – {formatRentalDate(item.expectedEndDate)}
                      </p>
                      <p className="mt-0.5 font-semibold text-primary">
                        {formatEquipmentListingRate(item.estimatedRentalAmount, item.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded border border-border">
                  <ProductImage
                    compact
                    name={name}
                    role="thumbnail"
                    sizes="80px"
                    src={product?.thumbnailUrl ?? null}
                  />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">{name}</p>
                  {selection ? (
                    <>
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
                    </>
                  ) : null}
                </div>
              </div>
            )}
            <Separator className="my-4" />
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-3 text-xs sm:text-sm">
                <dt className="text-muted-foreground">
                  {isCartMode ? `Tiền thuê (${cartItems!.length} mục)` : "Tiền thuê"}
                </dt>
                <dd className="font-medium">{price(effectiveRentalTotal)}</dd>
              </div>
              <div className="flex justify-between gap-3 text-xs sm:text-sm">
                <dt className="text-muted-foreground">Tiền cọc</dt>
                <dd className="font-medium">{price(effectiveDepositTotal)}</dd>
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
              <Link href={product ? `/products/${product.id}` : "/cart"}>
                <ArrowLeft className="size-4" /> {product ? "Quay lại thiết bị" : "Quay lại giỏ hàng"}
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
      {creatingBankAccount && (
        <BankAccountCreateDialog
          isFirstAccount={bankAccounts?.length === 0}
          onChanged={async () => {
            await invalidateBankAccounts();
            const nextAccounts = queryClient.getQueryData<RenterBankAccount[]>(
              bankAccountsQueryKey,
            );
            const created = nextAccounts?.find(
              (acc) => !bankAccounts?.some((prev) => prev.id === acc.id),
            );
            if (created)
              setValue("bankAccountId", created.id, { shouldValidate: true });
          }}
          onClose={() => setCreatingBankAccount(false)}
        />
      )}
      {deletingBankAccount && (
        <BankAccountDeleteDialog
          account={deletingBankAccount}
          onChanged={invalidateBankAccounts}
          onClose={() => setDeletingBankAccount(null)}
        />
      )}
      {editingBankAccount && (
        <BankAccountEditDialog
          account={editingBankAccount}
          onChanged={invalidateBankAccounts}
          onClose={() => setEditingBankAccount(null)}
        />
      )}
    </div>
  );
}
