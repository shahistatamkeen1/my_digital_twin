export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

let refreshPromise: Promise<boolean> | null = null;

function buildUrl(path: string): string {
  return path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
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

export async function readApiError(
  response: Response,
  fallback = "The request could not be completed."
): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (data?.detail && typeof data.detail === "object") {
      return data.detail.message || fallback;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((item: { msg?: string }) => item.msg)
        .filter(Boolean)
        .join(" ");
    }

    if (typeof data?.message === "string") {
      return data.message;
    }
  } catch {
    // Use the fallback when the backend did not return JSON.
  }

  return fallback;
}
