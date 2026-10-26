export type CreateRenterBankAccountRequest = {
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
};

export type UpdateRenterBankAccountRequest = {
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
};

export type RenterBankAccount = {
  id: string;
  bankCode: string | null;
  accountNumber: string | null;
  accountHolderName: string | null;
  isDefault: boolean;
};
