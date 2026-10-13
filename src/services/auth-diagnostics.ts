// Log identifiers supplied by the backend, never cookies, credentials or tokens.
export async function logAuthFailure(stage: string, response: Response) {
  let problem: Record<string, unknown> = {};
  try {
    problem = await response.clone().json();
  } catch {
    // Authentication failures can also have an empty or non-JSON body.
  }
  console.warn("Authentication request failed", {
    stage,
    status: response.status,
    code: typeof problem?.code === "string" ? problem.code : undefined,
    title: typeof problem?.title === "string" ? problem.title : undefined,
    traceId: typeof problem?.traceId === "string" ? problem.traceId : undefined,
  });
}
