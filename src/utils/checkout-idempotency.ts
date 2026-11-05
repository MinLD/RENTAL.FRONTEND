import type { CheckoutRequest } from "@/types/checkout";

export type CheckoutIdempotencyAttempt = {
  signature: string;
  key: string;
  storageKey: string | null;
};

const ATTEMPT_PREFIX = "dprental:checkout:attempt:";
export async function getCheckoutIdempotencyKey(
  request?: CheckoutRequest,
  _previous?: CheckoutIdempotencyAttempt | null,
): Promise<CheckoutIdempotencyAttempt> {
  const signature = request ? JSON.stringify(request) : "";
  const key = crypto.randomUUID();
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(ATTEMPT_PREFIX) || k?.startsWith("dprental:checkout:")) {
          sessionStorage.removeItem(k);
        }
      }
    }
  } catch {}
  return { signature, key, storageKey: null };
}

export function rememberCheckoutAttempt(_id: string, _storageKey: string | null) {
  // Each checkout gets a fresh unique key
}

export function clearCheckoutAttempt(_id: string) {
  // Each checkout gets a fresh unique key
}
