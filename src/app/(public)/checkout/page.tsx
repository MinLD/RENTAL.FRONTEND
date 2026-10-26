import Link from "next/link";
import { redirect } from "next/navigation";

import { BuyNowCheckout } from "@/components/checkout/buy-now-checkout";
import { ErrorState } from "@/components/error-state";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { QueryProvider } from "@/providers/query-provider";
import { getPublicEquipmentListing } from "@/services/queries/inventory-queries";
import { getRenterAddressesForServer } from "@/services/renter-address-server-service";
import { getRenterBankAccountsForServer } from "@/services/renter-bank-account-server-service";
import { getCurrentUser } from "@/services/session-service";
import type { BuyNowSelection } from "@/types/checkout";
import { validateCartItem } from "@/utils/cart";
import { getRentalDayCount, getTodayRentalDate } from "@/utils/product-detail";
import { calculateRentalPrice } from "@/utils/rental-pricing";
import { withReturnTo } from "@/utils/return-to";

type CheckoutSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function parseSelection(params: CheckoutSearchParams): BuyNowSelection | null {
  const equipmentListingId = first(params.listingId);
  const quantity = Number(first(params.quantity));
  const expectedStartDate = first(params.from);
  const expectedEndDate = first(params.to);
  if (!equipmentListingId || !Number.isSafeInteger(quantity) || quantity < 1 ||
    !expectedStartDate || !expectedEndDate) return null;
  return { equipmentListingId, quantity, expectedStartDate, expectedEndDate };
}

function CheckoutUnavailable({ title, description, href }: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Container className="py-12">
      <ErrorState
        action={<Button asChild><Link href={href}>Quay lại thiết bị</Link></Button>}
        description={description}
        title={title}
      />
    </Container>
  );
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<CheckoutSearchParams>;
}) {
  const params = await searchParams;
  const selection = parseSelection(params);
  if (!selection) {
    return <CheckoutUnavailable
      description="Thông tin thiết bị hoặc ngày thuê không hợp lệ. Vui lòng chọn lại."
      href="/search"
      title="Không thể tiếp tục đặt thuê"
    />;
  }

  const query = new URLSearchParams({
    listingId: selection.equipmentListingId,
    quantity: String(selection.quantity),
    from: selection.expectedStartDate,
    to: selection.expectedEndDate,
  });
  const checkoutHref = `/checkout?${query}`;
  const user = await getCurrentUser();
  if (!user) redirect(withReturnTo("/login", checkoutHref));
  const invalidDates = validateCartItem(selection, getTodayRentalDate());
  if (invalidDates) {
    return <CheckoutUnavailable
      description={invalidDates}
      href={`/products/${encodeURIComponent(selection.equipmentListingId)}`}
      title="Cần chọn lại ngày thuê"
    />;
  }

  const [productResult, addressResult, bankAccountsResult] = await Promise.all([
    getPublicEquipmentListing(selection.equipmentListingId),
    getRenterAddressesForServer(),
    getRenterBankAccountsForServer(),
  ]);
  if (!productResult.success) {
    return <CheckoutUnavailable
      description="Không thể tải thông tin thiết bị. Vui lòng thử lại từ trang chi tiết."
      href={`/products/${encodeURIComponent(selection.equipmentListingId)}`}
      title="Không thể chuẩn bị đơn thuê"
    />;
  }

  const product = productResult.data;
  const estimate = calculateRentalPrice(
    getRentalDayCount(selection.expectedStartDate, selection.expectedEndDate),
    selection.quantity,
    product.rentalRate,
  );
  if (selection.quantity > product.availableQuantity || !estimate ||
    product.depositAmount == null || !Number.isFinite(product.depositAmount) || product.depositAmount < 0) {
    return <CheckoutUnavailable
      description="Giá hoặc số lượng thiết bị đã thay đổi. Vui lòng kiểm tra lại trước khi đặt thuê."
      href={`/products/${encodeURIComponent(selection.equipmentListingId)}`}
      title="Cần kiểm tra lại thiết bị"
    />;
  }

  return (
    <QueryProvider>
      <BuyNowCheckout
        addresses={addressResult.addresses}
        addressesError={addressResult.error}
        bankAccounts={bankAccountsResult.bankAccounts}
        bankAccountsError={bankAccountsResult.error}
        depositAmount={product.depositAmount * selection.quantity}
        estimate={estimate}
        product={product}
        profileCompleted={user.isProfileCompleted}
        profileHref={withReturnTo("/account", checkoutHref)}
        selection={selection}
        termsVersion={process.env.RENTAL_TERMS_VERSION?.trim() || undefined}
        userId={user.id}
      />
    </QueryProvider>
  );
}
