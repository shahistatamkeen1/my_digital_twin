export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export const REQUEST_ID_HEADER = "X-Request-ID";

export type ApiErrorDetail = {
  field?: string;
  location?: string[];
  message?: string;
  type?: string;
  [key: string]: unknown;
};

export type StandardApiErrorPayload = {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[] | Record<string, unknown> | null;
  };
  meta?: {
    request_id?: string;
  };
  detail?: unknown;
  message?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor({
    message,
    status,
    code,
    requestId,
    details,
  }: {
    message: string;
    status: number;
    code: string;
    requestId?: string;
    details?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

let refreshPromise: Promise<boolean> | null = null;

function buildUrl(path: string): string {
  return path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function createRequestId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildRequestInit(init: RequestInit): RequestInit {
  const headers = new Headers(init.headers);

  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has(REQUEST_ID_HEADER)) {
    headers.set(REQUEST_ID_HEADER, createRequestId());
  }

  return {
    ...init,
    headers,
    credentials: "include",
  };
}

async function refreshAuthentication(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        [REQUEST_ID_HEADER]: createRequestId(),
      },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const url = buildUrl(path);
  const requestInit = buildRequestInit(init);
  let response = await fetch(url, requestInit);

  const isAuthenticationRoute = url.includes("/api/auth/");

  if (response.status === 401 && !isAuthenticationRoute) {
    const refreshed = await refreshAuthentication();

    if (refreshed) {
      response = await fetch(url, requestInit);
    }
  }

  return response;
}

function messageFromLegacyDetail(
  detail: unknown,
  fallback: string
): string {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const field =
            typeof record.field === "string" ? record.field : undefined;
          const message =
            typeof record.message === "string"
              ? record.message
              : typeof record.msg === "string"
                ? record.msg
                : undefined;

          if (field && message) {
            return `${field}: ${message}`;
          }

          return message;
        }

        return undefined;
      })
      .filter((value): value is string => Boolean(value));

    return messages.length > 0 ? messages.join(" ") : fallback;
  }

  if (detail && typeof detail === "object") {
    const record = detail as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }

    if (typeof record.status === "string" && record.status.trim()) {
      return record.status.replaceAll("_", " ");
    }
  }

  return fallback;
}

export async function parseApiError(
  response: Response,
  fallback = "The request could not be completed."
): Promise<ApiError> {
  let payload: StandardApiErrorPayload | null = null;

  try {
    payload = (await response.json()) as StandardApiErrorPayload;
  } catch {
    // Non-JSON responses use the fallback below.
  }

  const requestId =
    payload?.meta?.request_id ||
    response.headers.get(REQUEST_ID_HEADER) ||
    undefined;

  const message =
    payload?.error?.message ||
    (typeof payload?.message === "string" ? payload.message : undefined) ||
    messageFromLegacyDetail(payload?.detail, fallback);

  return new ApiError({
    message,
    status: response.status,
    code: payload?.error?.code || `HTTP_${response.status}`,
    requestId,
    details: payload?.error?.details ?? payload?.detail,
  });
}

export async function readApiError(
  response: Response,
  fallback = "The request could not be completed."
): Promise<string> {
  const error = await parseApiError(response, fallback);

  return error.requestId
    ? `${error.message} Reference: ${error.requestId}`
    : error.message;
}

export async function requireApiSuccess(
  response: Response,
  fallback?: string
): Promise<Response> {
  if (!response.ok) {
    throw await parseApiError(response, fallback);
  }

  return response;
}
