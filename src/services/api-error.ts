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

export type ApiErrorDetails = BackendProblemDetails & {
  code?: string;
  fieldErrors: Record<string, string[]>;
  message: string;
  status: number;
};

export type ApiResult<T> =
  { success: true; data: T } | { success: false; error: ApiErrorDetails };

export function normalizeApiError(
  response: Pick<Response, "status">,
  responseBody: unknown,
  fallbackMessage?: string,
): ApiErrorDetails {
  const code =
    getStringProperty(responseBody, "title") ??
    getStringProperty(responseBody, "code");

  return {
    ...(responseBody &&
    typeof responseBody === "object" &&
    !Array.isArray(responseBody)
      ? responseBody
      : {}),
    ...(code ? { code } : {}),
    fieldErrors: getApiFieldErrors(responseBody),
    message:
      getApiErrorMessage(responseBody) ??
      fallbackMessage ??
      getHttpErrorMessage(response.status),
    // HTTP status is authoritative; the response body may omit it or contain 0.
    status: response.status,
  };
}

export class ApiError extends Error {
  readonly code: ApiErrorDetails["code"];
  readonly details: ApiErrorDetails;
  readonly fieldErrors: ApiErrorDetails["fieldErrors"];
  readonly responseBody: unknown;
  readonly status: number;
  readonly statusText: string;

  constructor(
    response: Response,
    responseBody?: unknown,
    fallbackMessage?: string,
  ) {
    const details = normalizeApiError(response, responseBody, fallbackMessage);
    super(details.message);
    this.name = "ApiError";
    this.code = details.code;
    this.details = details;
    this.fieldErrors = details.fieldErrors;
    this.responseBody = responseBody;
    this.status = details.status;
    this.statusText = response.statusText;
  }
}

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

  return normalizeApiError(response, responseBody, fallbackMessage).message;
}

export function getApiErrorMessage(responseBody: unknown) {
  return (
    getStringProperty(responseBody, "detail") ??
    getValidationErrorMessage(responseBody) ??
    getStringProperty(responseBody, "title") ??
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

function getHttpErrorMessage(status: number) {
  switch (status) {
    case 400:
    case 422:
      return "Dữ liệu gửi lên không hợp lệ.";
    case 401:
      return "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.";
    case 403:
      return "Bạn không có quyền thực hiện thao tác này.";
    case 404:
      return "Không tìm thấy dữ liệu yêu cầu.";
    case 409:
      return "Dữ liệu bị trùng hoặc trạng thái không phù hợp.";
    case 429:
      return "Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.";
    default:
      return "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.";
  }
}

function getStringProperty(responseBody: unknown, propertyName: string) {
  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  const value = (responseBody as BackendProblemDetails)[propertyName];

  return typeof value === "string" && value.trim() ? value : null;
}
