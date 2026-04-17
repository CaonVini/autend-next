import type { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/src/modules/auth/auth-cookie.constants";
import { getEnv } from "@/src/server/config/env";

type AuthCookieInput = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

function baseCookieOptions() {
  const env = getEnv();

  return {
    domain: env.AUTH_COOKIE_DOMAIN,
    httpOnly: true,
    secure: env.NODE_ENV === "production",
  };
}

export function setAuthCookies(response: NextResponse, input: AuthCookieInput) {
  const baseOptions = baseCookieOptions();

  // Access token stays on the root path so server-rendered pages and API routes can read it.
  response.cookies.set({
    ...baseOptions,
    expires: input.accessTokenExpiresAt,
    name: AUTH_COOKIE_NAMES.accessToken,
    path: "/",
    sameSite: "lax",
    value: input.accessToken,
  });

  // Refresh token is restricted to auth routes to reduce accidental exposure surface.
  response.cookies.set({
    ...baseOptions,
    expires: input.refreshTokenExpiresAt,
    name: AUTH_COOKIE_NAMES.refreshToken,
    path: "/api/auth",
    sameSite: "strict",
    value: input.refreshToken,
  });

  response.headers.set("Cache-Control", "no-store");
}

export function clearAuthCookies(response: NextResponse) {
  const baseOptions = baseCookieOptions();

  response.cookies.set({
    ...baseOptions,
    expires: new Date(0),
    name: AUTH_COOKIE_NAMES.accessToken,
    path: "/",
    sameSite: "lax",
    value: "",
  });

  response.cookies.set({
    ...baseOptions,
    expires: new Date(0),
    name: AUTH_COOKIE_NAMES.refreshToken,
    path: "/api/auth",
    sameSite: "strict",
    value: "",
  });

  response.headers.set("Cache-Control", "no-store");
}
