"use client";

import { useCallback } from "react";

import { unwrapActionResult } from "@/services/action-result";
import type { ActionResult } from "@/types/action-result";

// Keep the existing DTO/catch contract inside client-side controllers.
export function useActionResult<Args extends unknown[], Data>(
  action: (...args: Args) => Promise<ActionResult<Data>>,
) {
  return useCallback(
    async (...args: Args): Promise<Data> =>
      unwrapActionResult(await action(...args)),
    [action],
  );
}
