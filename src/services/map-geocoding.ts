import type { MapCoordinates, MapReverseAddress } from "@/types/map";
import { parseMapCoordinates } from "@/utils/map-coordinates";

const resultCache = new Map<string, MapCoordinates | null>();
const reverseCache = new Map<string, MapReverseAddress | null>();
let lastRequestStartedAt = 0;
let rateLimitQueue = Promise.resolve();

async function waitForRateLimit() {
  const previousRequest = rateLimitQueue;
  let release!: () => void;
  rateLimitQueue = new Promise<void>((resolve) => { release = resolve; });
  await previousRequest;
  const delay = Math.max(0, 1_100 - (Date.now() - lastRequestStartedAt));
  if (delay) await new Promise<void>((resolve) => window.setTimeout(resolve, delay));
  lastRequestStartedAt = Date.now();
  release();
}

/** Find a starting point near the ward so the user can adjust the pin precisely. */
export async function findWardMapCenter(wardName: string, provinceName: string): Promise<MapCoordinates | null> {
  const cacheKey = `${wardName},${provinceName}`.toLocaleLowerCase("vi-VN");
  if (resultCache.has(cacheKey)) return resultCache.get(cacheKey) ?? null;

  await waitForRateLimit();
  try {
    const url = new URL("/api/map-geocoding", window.location.origin);
    url.searchParams.set("mode", "search");
    url.searchParams.set("ward", wardName);
    url.searchParams.set("province", provinceName);
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return null;
    const body = await response.json() as { coordinates?: MapCoordinates | null };
    const center = parseMapCoordinates(body.coordinates?.latitude, body.coordinates?.longitude);
    resultCache.set(cacheKey, center);
    return center;
  } catch {
    return null;
  }
}

/** Look up the nearest mapped address after the user moves the pin or requests GPS. */
export async function findMapAddress(coordinates: MapCoordinates): Promise<MapReverseAddress | null> {
  const cacheKey = `${coordinates.latitude.toFixed(5)},${coordinates.longitude.toFixed(5)}`;
  if (reverseCache.has(cacheKey)) return reverseCache.get(cacheKey) ?? null;

  await waitForRateLimit();
  try {
    const url = new URL("/api/map-geocoding", window.location.origin);
    url.searchParams.set("mode", "reverse");
    url.searchParams.set("lat", String(coordinates.latitude));
    url.searchParams.set("lon", String(coordinates.longitude));
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return null;
    const body = await response.json() as { address?: MapReverseAddress | null };
    const address = body.address ?? null;
    reverseCache.set(cacheKey, address);
    return address;
  } catch {
    return null;
  }
}
