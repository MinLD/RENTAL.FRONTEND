import type { MapCoordinates } from "@/types/map";

// Blank fields must not create a marker at (0, 0).
export function parseMapCoordinates(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): MapCoordinates | null {
  if (
    latitude == null || longitude == null ||
    String(latitude).trim() === "" || String(longitude).trim() === ""
  ) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (
    !Number.isFinite(lat) || !Number.isFinite(lng) ||
    lat < -90 || lat > 90 || lng < -180 || lng > 180
  ) {
    return null;
  }

  return { latitude: lat, longitude: lng };
}
