import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/src/modules/auth/auth-cookie.constants";
import { resolveCurrentSession } from "@/src/server/auth/services/current-session.service";
import { setAuthCookies } from "@/src/server/auth/utils/auth-cookies";
import { getRequestMetadata } from "@/src/server/core/security/request-metadata";

export async function handleCurrentSession(request: NextRequest) {
  const sessionResult = await resolveCurrentSession({
    rawAccessToken: request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value,
    rawRefreshToken: request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value,
    requestMetadata: getRequestMetadata(request),
  });

  const response = NextResponse.json(
    {
      data: {
        refreshed: sessionResult.refreshed,
        user: sessionResult.user,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 200,
    },
  );

  if (sessionResult.refreshed && sessionResult.issuedSession) {
    setAuthCookies(response, sessionResult.issuedSession);
  }

  return response;
}
