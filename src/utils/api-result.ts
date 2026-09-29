export type ApiValueResult<TValue> = {
  error?: {
    code?: string | null;
    message?: string | null;
    type?: number | null;
  } | null;
  isFailure?: boolean;
  isSuccess?: boolean;
  value: TValue;
};

export function unwrapApiValue<TValue>(
  response: ApiValueResult<TValue> | TValue,
): TValue {
  if (
    response &&
    typeof response === "object" &&
    "value" in response
  ) {
    return response.value as TValue;
  }

  return response as TValue;
}
