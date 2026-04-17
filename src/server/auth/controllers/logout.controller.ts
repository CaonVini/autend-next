import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/src/modules/auth/auth-cookie.constants";
import { logoutSession } from "@/src/server/auth/services/logout.service";
import { clearAuthCookies } from "@/src/server/auth/utils/auth-cookies";
import { assertCsrfProtection } from "@/src/server/core/security/csrf";
import { getRequestMetadata } from "@/src/server/core/security/request-metadata";

export async function handleLogout(request: NextRequest) {
  assertCsrfProtection(request);

  await logoutSession({
    rawAccessToken: request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value,
    rawRefreshToken: request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value,
    requestMetadata: getRequestMetadata(request),
  });

  const response = NextResponse.json(
    {
      data: {
        success: true,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 200,
    },
  );

  clearAuthCookies(response);
  return response;
}
