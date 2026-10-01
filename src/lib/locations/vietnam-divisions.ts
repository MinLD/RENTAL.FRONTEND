import snapshot from "@/data/vietnam-divisions.json";

export type Ward = { code: string; name: string };
export type Province = { code: string; name: string; wards: readonly Ward[] };
export type ProvinceWardValue = { province: string; ward: string };

export const VIETNAM_PROVINCES: readonly Province[] = snapshot.provinces;

export function findProvince(name: string) {
  return VIETNAM_PROVINCES.find((province) => province.name === name);
}

export function isProvinceWardPair(provinceName: string, wardName: string) {
  return Boolean(
    findProvince(provinceName)?.wards.some((ward) => ward.name === wardName),
  );
}
