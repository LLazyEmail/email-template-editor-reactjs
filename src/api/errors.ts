/** Pulls the backend's `{ error: { message } }` out of an axios error, else the plain message. */
export function errorMessage(error: unknown): string {
  const apiMessage = (error as { response?: { data?: { error?: { message?: unknown } } } })
    ?.response?.data?.error?.message;
  if (typeof apiMessage === "string") return apiMessage;
  return error instanceof Error ? error.message : String(error);
}
