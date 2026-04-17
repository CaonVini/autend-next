import { NextResponse, type NextRequest } from "next/server";
import { AUTH_REDIRECT_PATHS } from "@/src/modules/auth/auth-cookie.constants";
import { credentialLoginSchema } from "@/src/modules/auth/schemas/auth-request.schemas";
import { authenticateWithCredentials } from "@/src/server/auth/services/credential-auth.service";
import { setAuthCookies } from "@/src/server/auth/utils/auth-cookies";
import { parseJsonRequest } from "@/src/server/core/http/request-parsing";
import { assertCsrfProtection } from "@/src/server/core/security/csrf";
import { getRequestMetadata } from "@/src/server/core/security/request-metadata";

export async function handleCredentialLogin(request: NextRequest) {
  assertCsrfProtection(request);

  const payload = await parseJsonRequest(request, credentialLoginSchema);
  const authenticationResult = await authenticateWithCredentials(
    payload,
    getRequestMetadata(request),
  );

  const response = NextResponse.json(
    {
      data: {
        redirectPath: AUTH_REDIRECT_PATHS.afterLogin,
        user: authenticationResult.user,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 200,
    },
  );

  setAuthCookies(response, authenticationResult.issuedSession);
  return response;
}
