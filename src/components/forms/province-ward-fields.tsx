"use client";

import { useId, useMemo, type Ref } from "react";

import { ProvinceField } from "@/components/forms/province-field";
import { SearchableSelectField } from "@/components/forms/searchable-select-field";
import {
  VIETNAM_PROVINCES,
  type Province,
  type ProvinceWardValue,
} from "@/lib/locations/vietnam-divisions";

export type ProvinceWardFieldsProps = {
  disabled?: boolean;
  idPrefix?: string;
  onChange: (value: ProvinceWardValue) => void;
  onProvinceBlur?: () => void;
  onWardBlur?: () => void;
  provinceError?: string;
  provinceRef?: Ref<HTMLButtonElement>;
  provinces?: readonly Province[];
  required?: boolean;
  value: ProvinceWardValue;
  wardError?: string;
  wardRef?: Ref<HTMLButtonElement>;
};

export function ProvinceWardFields({
  disabled,
  idPrefix,
  onChange,
  onProvinceBlur,
  onWardBlur,
  provinceError,
  provinceRef,
  provinces = VIETNAM_PROVINCES,
  required,
  value,
  wardError,
  wardRef,
}: ProvinceWardFieldsProps) {
  const generatedId = useId();
  const prefix = idPrefix ?? generatedId;
  const province = provinces.find((item) => item.name === value.province);
  const ward = province?.wards.find((item) => item.name === value.ward);
  const wardOptions = useMemo(
    () => province?.wards.map((item) => ({ label: item.name, value: item.code })) ?? [],
    [province],
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ProvinceField
        disabled={disabled}
        error={provinceError}
        id={`${prefix}-province`}
        label="Tỉnh / Thành phố"
        onBlur={onProvinceBlur}
        onChange={(name) => {
          if (name !== value.province) {
            onChange({ province: name, ward: "" });
          }
        }}
        provinces={provinces}
        placeholder="Chọn tỉnh / thành phố"
        ref={provinceRef}
        required={required}
        value={value.province}
      />
      <SearchableSelectField
        disabled={disabled || !province}
        error={wardError}
        id={`${prefix}-ward`}
        label="Phường / Xã"
        onBlur={onWardBlur}
        onChange={(code) => {
          const nextWard = province?.wards.find((item) => item.code === code);
          if (nextWard) onChange({ province: value.province, ward: nextWard.name });
        }}
        options={wardOptions}
        placeholder={province ? "Chọn phường / xã" : "Chọn tỉnh / thành phố trước"}
        ref={wardRef}
        required={required}
        value={ward?.code ?? ""}
      />
    </div>
  );
}
