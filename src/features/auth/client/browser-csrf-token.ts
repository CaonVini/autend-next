import { AUTH_COOKIE_NAMES } from "@/src/modules/auth/auth-cookie.constants";

export function getBrowserCsrfToken() {
  if (typeof document === "undefined") {
    return "";
  }

  const cookieName = `${AUTH_COOKIE_NAMES.csrfToken}=`;
  const cookieValue = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(cookieName));

  return cookieValue ? decodeURIComponent(cookieValue.slice(cookieName.length)) : "";
}
