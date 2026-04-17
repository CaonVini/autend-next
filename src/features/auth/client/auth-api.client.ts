import { getBrowserCsrfToken } from "@/src/features/auth/client/browser-csrf-token";

type ApiErrorPayload = {
  error: {
    code: string;
    fieldErrors?: Record<string, string[] | undefined>;
    message: string;
  };
};

type ApiSuccessPayload<TData> = {
  data: TData;
};

export class AuthApiError extends Error {
  readonly code: string;
  readonly fieldErrors?: Record<string, string[] | undefined>;

  constructor(payload: ApiErrorPayload["error"]) {
    super(payload.message);
    this.code = payload.code;
    this.fieldErrors = payload.fieldErrors;
    this.name = "AuthApiError";
  }
}

async function requestJson<TData>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<TData> {
  const method = init.method?.toUpperCase() ?? "GET";
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");

  if (method !== "GET") {
    headers.set("Content-Type", "application/json");

    const csrfToken = getBrowserCsrfToken();

    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiErrorPayload
    | ApiSuccessPayload<TData>
    | null;

  if (!response.ok || !payload || !("data" in payload)) {
    throw new AuthApiError(
      payload && "error" in payload
        ? payload.error
        : {
            code: "REQUEST_FAILED",
            message: "Nao foi possivel concluir a operacao.",
          },
    );
  }

  return payload.data;
}

export function loginWithCredentials(payload: { email: string; password: string }) {
  return requestJson<{
    redirectPath: string;
    user: { email: string; id: string; name: string; companyName?: string };
  }>("/api/auth/login", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function registerWithCredentials(payload: {
  company?: string;
  confirmPassword: string;
  email: string;
  name: string;
  password: string;
}) {
  return requestJson<{ message: string }>("/api/auth/register", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function fetchCurrentSession() {
  return requestJson<{
    refreshed: boolean;
    user: { email: string; id: string; name: string; companyName?: string };
  }>("/api/auth/session");
}

export function logoutCurrentSession() {
  return requestJson<{ success: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}
