"use client";

import { useMemo } from "react";

import { ProvinceField } from "@/components/forms/province-field";
import { TextField } from "@/components/forms/text-field";
import { VIETNAM_PROVINCES } from "@/lib/locations/vietnam-divisions";
import type { SaveRenterAddressRequest } from "@/types/renter-address";

export type AddressField = keyof SaveRenterAddressRequest;
export type AddressFieldErrors = Partial<Record<AddressField, string>>;

export const emptyAddress: SaveRenterAddressRequest = {
  province: "",
  addressDetail: "",
  recipientName: "",
  recipientPhone: "",
};

export function getAddressFieldErrors(fieldErrors: Record<string, string[] | undefined>): AddressFieldErrors {
  return {
    province: fieldErrors.province?.[0],
    addressDetail: fieldErrors.addressDetail?.[0],
    recipientName: fieldErrors.recipientName?.[0],
    recipientPhone: fieldErrors.recipientPhone?.[0],
  };
}

export function AddressFormFields({
  disabled,
  draft,
  errors,
  idPrefix,
  onChange,
}: {
  disabled: boolean;
  draft: SaveRenterAddressRequest;
  errors: AddressFieldErrors;
  idPrefix: string;
  onChange: (field: AddressField, value: string) => void;
}) {
  const provinces = useMemo(() => {
    if (draft.province && !VIETNAM_PROVINCES.some((item) => item.name === draft.province)) {
      return [
        ...VIETNAM_PROVINCES,
        { code: "saved-province", name: draft.province, wards: [] },
      ];
    }
    return VIETNAM_PROVINCES;
  }, [draft.province]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          autoComplete="name"
          disabled={disabled}
          error={errors.recipientName}
          id={`${idPrefix}-recipient-name`}
          label="Tên người nhận"
          maxLength={100}
          onChange={(event) => onChange("recipientName", event.target.value)}
          required
          value={draft.recipientName}
        />
        <TextField
          autoComplete="tel"
          disabled={disabled}
          error={errors.recipientPhone}
          id={`${idPrefix}-recipient-phone`}
          inputMode="tel"
          label="Số điện thoại"
          onChange={(event) => onChange("recipientPhone", event.target.value)}
          placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx"
          required
          value={draft.recipientPhone}
        />
      </div>
      <ProvinceField
        disabled={disabled}
        error={errors.province}
        id={`${idPrefix}-province`}
        onChange={(value) => onChange("province", value)}
        provinces={provinces}
        required
        value={draft.province}
      />
      <TextField
        autoComplete="street-address"
        disabled={disabled}
        error={errors.addressDetail}
        id={`${idPrefix}-detail`}
        label="Địa chỉ chi tiết"
        maxLength={200}
        onChange={(event) => onChange("addressDetail", event.target.value)}
        placeholder="Số nhà, đường, phường / xã..."
        required
        value={draft.addressDetail}
      />
    </>
  );
}
