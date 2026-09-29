export async function getActionResponseErrorMessage(
  response: Response,
  fallbackMessage: string,
) {
  let responseBody: unknown;

  try {
    responseBody = await response.clone().json();
  } catch {
    return fallbackMessage;
  }

  return (
    getValidationErrorMessage(responseBody) ??
    getProblemDetailMessage(responseBody) ??
    fallbackMessage
  );
}

function getValidationErrorMessage(responseBody: unknown) {
  if (
    !responseBody ||
    typeof responseBody !== "object" ||
    !("errors" in responseBody) ||
    !responseBody.errors ||
    typeof responseBody.errors !== "object"
  ) {
    return null;
  }

  const messages = Object.values(responseBody.errors).flatMap((value) => {
    if (Array.isArray(value)) {
      return value.filter(
        (message): message is string => typeof message === "string",
      );
    }

    return typeof value === "string" ? [value] : [];
  });

  return messages.length ? messages.join("\n") : null;
}

function getProblemDetailMessage(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  if (
    "detail" in responseBody &&
    typeof responseBody.detail === "string" &&
    responseBody.detail
  ) {
    return responseBody.detail;
  }

  if (
    "title" in responseBody &&
    typeof responseBody.title === "string" &&
    responseBody.title
  ) {
    return responseBody.title;
  }

  if (
    "message" in responseBody &&
    typeof responseBody.message === "string" &&
    responseBody.message
  ) {
    return responseBody.message;
  }

  return null;
}
