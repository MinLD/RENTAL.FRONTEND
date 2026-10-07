export type BackendProblemDetails = {
  detail?: string | null;
  errors?: unknown;
  instance?: string | null;
  message?: string | null;
  status?: number | null;
  title?: string | null;
  type?: string | null;
  [key: string]: unknown;
};

export class ApiInputError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiInputError";
  }
}

export function getApiFieldErrors(
  responseBody: unknown,
): Record<string, string[]> {
  if (
    !responseBody ||
    typeof responseBody !== "object" ||
    !("errors" in responseBody)
  ) {
    return {};
  }

  const errors = responseBody.errors;

  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(errors)
      .map(
        ([field, value]) => [field, collectValidationMessages(value)] as const,
      )
      .filter(([, messages]) => messages.length > 0),
  );
}

export async function readResponseJson(response: Response) {
  try {
    return (await response.clone().json()) as unknown;
  } catch {
    return undefined;
  }
}

export async function getResponseErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  const responseBody = await readResponseJson(response);

  return getApiErrorMessage(responseBody) ?? fallbackMessage;
}

export function getApiErrorMessage(responseBody: unknown) {
  return (
    getValidationErrorMessage(responseBody) ??
    getProblemDetailsMessage(responseBody) ??
    getStringProperty(responseBody, "message") ??
    getStringProperty(responseBody, "error") ??
    getStringProperty(responseBody, "errorMessage")
  );
}

function getValidationErrorMessage(responseBody: unknown) {
  if (
    !responseBody ||
    typeof responseBody !== "object" ||
    !("errors" in responseBody) ||
    !responseBody.errors
  ) {
    return null;
  }

  return collectValidationMessages(responseBody.errors).join("\n") || null;
}

function collectValidationMessages(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectValidationMessages);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectValidationMessages);
  }

  return [];
}

function getProblemDetailsMessage(responseBody: unknown) {
  return (
    getStringProperty(responseBody, "detail") ??
    getStringProperty(responseBody, "title")
  );
}

function getStringProperty(responseBody: unknown, propertyName: string) {
  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  const value = (responseBody as BackendProblemDetails)[propertyName];

  return typeof value === "string" && value.trim() ? value : null;
}
