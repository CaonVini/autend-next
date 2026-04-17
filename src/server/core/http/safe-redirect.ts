import { AUTH_REDIRECT_PATHS } from "@/src/modules/auth/auth-cookie.constants";

export function sanitizeRelativeRedirectPath(candidate?: string | null) {
  if (!candidate) {
    return AUTH_REDIRECT_PATHS.afterLogin;
  }

  const normalizedValue = candidate.trim();

  if (!normalizedValue.startsWith("/") || normalizedValue.startsWith("//")) {
    return AUTH_REDIRECT_PATHS.afterLogin;
  }

  return normalizedValue;
}
