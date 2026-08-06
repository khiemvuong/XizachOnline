export interface SocketErrorPayload {
  code?: string;
  message?: string;
}

export function normalizeSocketError(error: unknown, fallback: string) {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as SocketErrorPayload).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}
