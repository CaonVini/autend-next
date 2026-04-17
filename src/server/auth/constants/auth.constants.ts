export const AUTH_PROVIDER_NAMES = {
  google: "google",
} as const;

export const AUTH_JWT_TYPES = {
  access: "access",
  refresh: "refresh",
} as const;

export const AUTH_JWT_AUDIENCES = {
  access: "autend-api",
  refresh: "autend-refresh",
} as const;

export const AUTH_RATE_LIMIT_PREFIXES = {
  loginByEmail: "auth:login:email",
  loginByIp: "auth:login:ip",
  refreshByIp: "auth:refresh:ip",
  registerByEmail: "auth:register:email",
  registerByIp: "auth:register:ip",
} as const;

export const AUTH_QUERY_STATUSES = {
  emailVerified: "email-verified",
  googleConflict: "google-account-conflict",
  oauthCancelled: "oauth-cancelled",
  sessionExpired: "session-expired",
  verificationInvalid: "verification-invalid",
} as const;
