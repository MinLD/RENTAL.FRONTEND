import type { CheckoutRequest } from "@/types/checkout";

export type CheckoutIdempotencyAttempt = {
  signature: string;
  key: string;
  storageKey: string | null;
};

const ATTEMPT_PREFIX = "dprental:checkout:attempt:";

export async function getCheckoutIdempotencyKey(
  request: CheckoutRequest,
  previous: CheckoutIdempotencyAttempt | null,
): Promise<CheckoutIdempotencyAttempt> {
  const signature = JSON.stringify(request);
  if (previous?.signature === signature) return previous;

  let storageKey: string | null = null;
  try {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(signature));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    storageKey = `dprental:checkout:${hash}`;
    const saved = sessionStorage.getItem(storageKey);
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return { signature, key: saved, storageKey };
  } catch {
    // Private browsing may deny storage; retries still reuse the key in this mount.
  }

  const key = crypto.randomUUID();
  if (storageKey) {
    try { sessionStorage.setItem(storageKey, key); } catch { /* Storage may be unavailable. */ }
  }
  return { signature, key, storageKey };
}

export function rememberCheckoutAttempt(id: string, storageKey: string | null) {
  if (!storageKey) return;
  try { sessionStorage.setItem(`${ATTEMPT_PREFIX}${id}`, storageKey); } catch { /* Storage may be unavailable. */ }
}

export function clearCheckoutAttempt(id: string) {
  try {
    const marker = `${ATTEMPT_PREFIX}${id}`;
    const storageKey = sessionStorage.getItem(marker);
    if (storageKey) sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(marker);
  } catch { /* Storage may be unavailable. */ }
}
