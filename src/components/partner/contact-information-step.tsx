"use client";

import { MapPin } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { ProvinceWardFormFields } from "@/components/forms/province-ward-form-fields";
import { TextField } from "@/components/forms/text-field";
import type { PartnerRegistrationFormValues } from "@/lib/validations/partner-registration";

export function ContactInformationStep() {
  const {
    control,
    formState: { errors },
    register,
  } = useFormContext<PartnerRegistrationFormValues>();

  return (
    <div className="mt-8 space-y-8">
      <section aria-labelledby="partner-contact-heading" className="space-y-4">
        <h2
          className="text-sm font-semibold text-foreground"
          id="partner-contact-heading"
        >
          Thông tin liên hệ
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            autoComplete="email"
            error={errors.contactEmail?.message}
            id="partner-contact-email"
            label="Email liên hệ"
            maxLength={254}
            placeholder="contact@company.vn"
            required
            type="email"
            {...register("contactEmail")}
          />
          <TextField
            autoComplete="tel"
            error={errors.contactPhone?.message}
            id="partner-contact-phone"
            label="Số điện thoại"
            maxLength={12}
            placeholder="0901234567"
            required
            type="tel"
            {...register("contactPhone")}
          />
        </div>
      </section>
      <section aria-labelledby="partner-address-heading" className="space-y-4">
        <h2
          className="text-sm font-semibold text-foreground"
          id="partner-address-heading"
        >
          Địa chỉ doanh nghiệp
        </h2>
        <ProvinceWardFormFields
          control={control}
          idPrefix="partner-address"
          provinceName="province"
          required
          wardName="ward"
        />
        <TextField
          autoComplete="street-address"
          error={errors.address?.message}
          id="partner-address-detail"
          label="Địa chỉ chi tiết"
          leftIcon={<MapPin className="size-4" />}
          maxLength={250}
          placeholder="Số nhà, tên đường, khu phố..."
          required
          {...register("address")}
        />
      </section>
    </div>
  );
}
