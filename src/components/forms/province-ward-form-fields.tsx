"use client";

import {
  useController,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from "react-hook-form";

import {
  ProvinceWardFields,
  type ProvinceWardFieldsProps,
} from "@/components/forms/province-ward-fields";

type ProvinceWardFormFieldsProps<T extends FieldValues> = Omit<
  ProvinceWardFieldsProps,
  | "onChange"
  | "onProvinceBlur"
  | "onWardBlur"
  | "provinceError"
  | "provinceRef"
  | "value"
  | "wardError"
  | "wardRef"
> & {
  control: Control<T>;
  provinceName: FieldPathByValue<T, string>;
  wardName: FieldPathByValue<T, string>;
};

export function ProvinceWardFormFields<T extends FieldValues>({
  control,
  provinceName,
  wardName,
  ...props
}: ProvinceWardFormFieldsProps<T>) {
  const province = useController({ control, name: provinceName });
  const ward = useController({ control, name: wardName });
  const provinceValue =
    typeof province.field.value === "string" ? province.field.value : "";
  const wardValue = typeof ward.field.value === "string" ? ward.field.value : "";

  return (
    <>
      <ProvinceWardFields
        {...props}
        onChange={(next) => {
          if (next.province !== provinceValue) {
            province.field.onChange(next.province);
          }
          if (next.ward !== wardValue) ward.field.onChange(next.ward);
        }}
        onProvinceBlur={province.field.onBlur}
        onWardBlur={ward.field.onBlur}
        provinceError={province.fieldState.error?.message}
        provinceRef={province.field.ref}
        value={{ province: provinceValue, ward: wardValue }}
        wardError={ward.fieldState.error?.message}
        wardRef={ward.field.ref}
      />
      <input name={provinceName} type="hidden" value={provinceValue} />
      <input name={wardName} type="hidden" value={wardValue} />
    </>
  );
}
