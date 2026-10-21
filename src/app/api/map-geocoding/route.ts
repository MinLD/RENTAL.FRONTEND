import type { MapCoordinates, MapReverseAddress } from "@/types/map";
import { parseMapCoordinates } from "@/utils/map-coordinates";

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    countrycode?: string;
    housenumber?: string;
    street?: string;
    name?: string;
    type?: string;
    locality?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
  };
};
type PhotonResponse = { features?: PhotonFeature[] };

const PHOTON_BASE_URL = process.env.MAP_GEOCODING_BASE_URL ?? "https://photon.komoot.io";

function normalizeName(value: string) {
  return value.toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/^(?:thanh pho|tinh|phuong|xa)\s+/, "")
    .trim();
}

function isInProvince(feature: PhotonFeature, province: string) {
  const properties = feature.properties;
  const target = normalizeName(province);
  return [properties?.state, properties?.city, properties?.county]
    .some((name) => name && normalizeName(name) === target);
}

async function fetchPhoton(path: string, params: Record<string, string>): Promise<PhotonResponse> {
  const url = new URL(path, PHOTON_BASE_URL);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "DPRentalFrontend/0.1" },
    signal: AbortSignal.timeout(7_000),
  });
  if (!response.ok) throw new Error(`Photon returned ${response.status}`);
  return response.json() as Promise<PhotonResponse>;
}

function searchCenter(body: PhotonResponse, provinceName: string): MapCoordinates | null {
  const results = body.features?.filter((feature) => feature.properties?.countrycode === "VN") ?? [];
  const feature = results.find((item) => isInProvince(item, provinceName));
  const point = feature?.geometry?.coordinates;
  return parseMapCoordinates(point?.[1], point?.[0]);
}

function reverseAddress(body: PhotonResponse): MapReverseAddress | null {
  const results = body.features?.filter((feature) => feature.properties?.countrycode === "VN") ?? [];
  const nearest = results[0]?.properties;
  if (!nearest) return null;

  const detail = results.find((feature) => feature.properties?.housenumber && feature.properties.street)?.properties
    ?? results.find((feature) => feature.properties?.street)?.properties
    ?? nearest;
  const street = detail.street ?? (detail.type === "street" ? detail.name : undefined);
  const addressDetail = [detail.housenumber, street]
    .filter((part): part is string => typeof part === "string" && Boolean(part.trim()))
    .join(" ").trim().slice(0, 500);
  const provinceNames = [nearest.state, nearest.city, nearest.county]
    .filter((name): name is string => typeof name === "string" && Boolean(name.trim()));
  const wardNames = [nearest.locality, nearest.district, nearest.city, nearest.name]
    .filter((name): name is string => typeof name === "string" && Boolean(name.trim()));
  return { addressDetail, provinceNames, wardNames };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("mode");
  try {
    if (mode === "search") {
      const ward = params.get("ward")?.trim() ?? "";
      const province = params.get("province")?.trim() ?? "";
      if (!ward || !province || ward.length > 100 || province.length > 100) {
        return Response.json({ error: "Invalid area" }, { status: 400 });
      }
      const result = await fetchPhoton("/api", { q: `${ward}, ${province}, Việt Nam`, limit: "5" });
      return Response.json({ coordinates: searchCenter(result, province) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (mode === "reverse") {
      const point = parseMapCoordinates(params.get("lat"), params.get("lon"));
      if (!point) return Response.json({ error: "Invalid coordinates" }, { status: 400 });
      const result = await fetchPhoton("/reverse", {
        lat: String(point.latitude), lon: String(point.longitude), radius: "0.1", limit: "5",
      });
      return Response.json({ address: reverseAddress(result) }, { headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ error: "Invalid mode" }, { status: 400 });
  } catch {
    return Response.json({ error: "Geocoding unavailable" }, { status: 503 });
  }
}
