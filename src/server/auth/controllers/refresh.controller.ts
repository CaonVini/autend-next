import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/src/modules/auth/auth-cookie.constants";
import { AUTH_RATE_LIMIT_PREFIXES } from "@/src/server/auth/constants/auth.constants";
import { setAuthCookies } from "@/src/server/auth/utils/auth-cookies";
import { rotateRefreshSession } from "@/src/server/auth/services/refresh-session.service";
import { getEnv } from "@/src/server/config/env";
import { assertCsrfProtection } from "@/src/server/core/security/csrf";
import { getRequestMetadata } from "@/src/server/core/security/request-metadata";
import { enforceRateLimit } from "@/src/server/core/security/rate-limit";
import { ApplicationError } from "@/src/server/core/errors/application-error";

export async function handleRefreshSession(request: NextRequest) {
  assertCsrfProtection(request);

  const requestMetadata = getRequestMetadata(request);
  const env = getEnv();

  await enforceRateLimit({
    durationSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
    key: requestMetadata.ipAddress ?? "unknown",
    keyPrefix: AUTH_RATE_LIMIT_PREFIXES.refreshByIp,
    maxAttempts: env.REFRESH_RATE_LIMIT_MAX_ATTEMPTS,
  });

  const rawRefreshToken = request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value;

  if (!rawRefreshToken) {
    throw new ApplicationError({
      code: "REFRESH_TOKEN_MISSING",
      publicMessage: "Sua sessao atual nao e valida.",
      statusCode: 401,
    });
  }

  const refreshResult = await rotateRefreshSession(rawRefreshToken, requestMetadata);
  const response = NextResponse.json(
    {
      data: {
        user: refreshResult.user,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 200,
    },
  );

  setAuthCookies(response, refreshResult.issuedSession);
  return response;
}
