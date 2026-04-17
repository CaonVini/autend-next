import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/src/modules/auth/auth-cookie.constants";
import { ApplicationError } from "@/src/server/core/errors/application-error";
import { safeCompare } from "@/src/server/core/security/crypto";

function resolveExpectedOrigin(request: NextRequest) {
  return request.nextUrl.origin;
}

export function assertSameOriginRequest(request: NextRequest) {
  const expectedOrigin = resolveExpectedOrigin(request);
  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");

  if (originHeader) {
    if (originHeader !== expectedOrigin) {
      throw new ApplicationError({
        code: "INVALID_ORIGIN",
        publicMessage: "A requisicao nao pode ser validada.",
        statusCode: 403,
      });
    }

    return;
  }

  if (refererHeader?.startsWith(expectedOrigin)) {
    return;
  }

  throw new ApplicationError({
    code: "MISSING_ORIGIN",
    publicMessage: "A requisicao nao pode ser validada.",
    statusCode: 403,
  });
}

export function assertCsrfProtection(request: NextRequest) {
  assertSameOriginRequest(request);

  const csrfCookie = request.cookies.get(AUTH_COOKIE_NAMES.csrfToken)?.value;
  const csrfHeader = request.headers.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader || !safeCompare(csrfCookie, csrfHeader)) {
    throw new ApplicationError({
      code: "INVALID_CSRF_TOKEN",
      publicMessage: "A requisicao nao pode ser validada.",
      statusCode: 403,
    });
  }
}
