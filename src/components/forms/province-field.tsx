"use client";

import { forwardRef, useMemo, type ComponentPropsWithoutRef } from "react";

import { SearchableSelectField } from "@/components/forms/searchable-select-field";
import {
  VIETNAM_PROVINCES,
  type Province,
} from "@/lib/locations/vietnam-divisions";

type ProvinceFieldProps = Omit<
  ComponentPropsWithoutRef<typeof SearchableSelectField>,
  "label" | "options"
> & {
  label?: string;
  provinces?: readonly Province[];
};

// Use codes inside the dropdown and return province names to the form.
export const ProvinceField = forwardRef<HTMLButtonElement, ProvinceFieldProps>(
  (
    {
      label = "Tỉnh / Thành phố",
      onChange,
      placeholder = "Chọn tỉnh / thành phố",
      provinces = VIETNAM_PROVINCES,
      value,
      ...props
    },
    ref,
  ) => {
    const province = provinces.find((item) => item.name === value);
    const options = useMemo(
      () => provinces.map((item) => ({ label: item.name, value: item.code })),
      [provinces],
    );

    return (
      <SearchableSelectField
        {...props}
        label={label}
        onChange={(code) => {
          const selected = provinces.find((item) => item.code === code);
          if (selected) onChange(selected.name);
        }}
        options={options}
        placeholder={placeholder}
        ref={ref}
        value={province?.code ?? ""}
      />
    );
  },
);

ProvinceField.displayName = "ProvinceField";
