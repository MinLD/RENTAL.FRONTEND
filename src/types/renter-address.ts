export type SaveRenterAddressRequest = {
  province: string;
  addressDetail: string;
  recipientName: string;
  recipientPhone: string;
};

export type RenterAddress = SaveRenterAddressRequest & {
  id: string;
  isDefault: boolean;
};
