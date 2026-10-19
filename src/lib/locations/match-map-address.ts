import { VIETNAM_PROVINCES, type Province, type Ward } from "@/lib/locations/vietnam-divisions";
import type { MapReverseAddress } from "@/types/map";

function normalizeName(value: string) {
  return value.toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutAdministrativePrefix(value: string) {
  return normalizeName(value)
    .replace(/^(?:thanh pho|tinh|phuong|xa|thi tran|tp)\s+/, "")
    .replace(/\s+city$/, "");
}

function matchesName(candidate: string, officialName: string) {
  return normalizeName(candidate) === normalizeName(officialName)
    || withoutAdministrativePrefix(candidate) === withoutAdministrativePrefix(officialName);
}

function findWard(province: Province, names: string[]): Ward | undefined {
  return province.wards.find((ward) => names.some((name) => matchesName(name, ward.name)));
}

/** Match OSM's place names against the codes accepted by the warehouse API. */
export function matchMapAddressToDivisions(address: MapReverseAddress, currentProvinceCode: string) {
  const province = VIETNAM_PROVINCES.find((item) =>
    address.provinceNames.some((name) => matchesName(name, item.name)));
  const currentProvince = VIETNAM_PROVINCES.find((item) => item.code === currentProvinceCode);
  const preferredProvince = province ?? currentProvince;
  const preferredWard = preferredProvince && findWard(preferredProvince, address.wardNames);
  if (province) return { provinceCode: province.code, wardCode: preferredWard?.code ?? null };
  if (preferredWard) return { provinceCode: preferredProvince.code, wardCode: preferredWard.code };

  const matchingWards = VIETNAM_PROVINCES.flatMap((item) => {
    const ward = findWard(item, address.wardNames);
    return ward ? [{ provinceCode: item.code, wardCode: ward.code }] : [];
  });
  if (matchingWards.length === 1) return matchingWards[0];
  return { provinceCode: null, wardCode: null };
}
