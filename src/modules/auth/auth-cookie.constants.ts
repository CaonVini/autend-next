export const AUTH_COOKIE_NAMES = {
  accessToken: "autend_access_token",
  csrfToken: "autend_csrf_token",
  refreshToken: "autend_refresh_token",
} as const;

export const AUTH_REDIRECT_PATHS = {
  afterLogin: "/dashboard",
  afterLogout: "/",
} as const;
