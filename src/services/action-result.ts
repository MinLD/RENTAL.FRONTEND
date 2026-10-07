import type { ActionError, ActionResult } from "@/types/action-result";

export class ActionResultError extends Error {
  readonly fieldErrors: ActionError["fieldErrors"];
  readonly status: number;

  constructor(error: ActionError) {
    super(error.message);
    this.name = "ActionResultError";
    this.fieldErrors = error.fieldErrors;
    this.status = error.status;
  }
}

export function unwrapActionResult<T>(result: ActionResult<T>): T {
  if (!result.success) {
    throw new ActionResultError(result.error);
  }

  return result.data;
}
