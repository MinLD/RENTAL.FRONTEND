export type AddCartItem = {
  equipmentListingId: string;
  quantity: number;
  expectedStartDate: string;
  expectedEndDate: string;
};

export type CartItem = AddCartItem & {
  cartItemId: string;
  name: string;
  thumbnailUrl: string | null;
  currency: string;
  currentDailyRate: number | null;
  currentDeposit: number | null;
  estimatedRentalAmount: number | null;
  status: string;
  message: string | null;
  availableQuantity?: number;
  mergeIdempotencyKey?: string;
  pendingSync?: boolean;
};

export type RentalCartLine = AddCartItem & {
  cartItemId: string;
  currentDailyRate: number | null;
  currentDeposit: number | null;
  estimatedRentalAmount: number | null;
  currentPriceVersion: string | null;
  status: string;
  message: string | null;
};

export type RentalCartResponse = {
  cartId: string | null;
  items: RentalCartLine[] | null;
};

export type CartItemSnapshot = {
  name: string;
  thumbnailUrl: string | null;
  currency: string;
  dailyRate: number | null;
  depositAmount: number | null;
  availableQuantity?: number;
};
