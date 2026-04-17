import { NextResponse, type NextRequest } from "next/server";
import { AUTH_QUERY_STATUSES } from "@/src/server/auth/constants/auth.constants";
import { googleCallbackQuerySchema } from "@/src/modules/auth/schemas/auth-request.schemas";
import { completeGoogleOAuthSignIn } from "@/src/server/auth/services/google-oauth.service";
import { setAuthCookies } from "@/src/server/auth/utils/auth-cookies";
import { getRequestMetadata } from "@/src/server/core/security/request-metadata";

function buildLoginRedirect(request: NextRequest, status: string) {
  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("auth", status);
  return redirectUrl;
}

export async function handleGoogleCallback(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());

    if (typeof searchParams.error === "string" && searchParams.error.trim()) {
      return NextResponse.redirect(
        buildLoginRedirect(request, AUTH_QUERY_STATUSES.oauthCancelled),
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const payload = googleCallbackQuerySchema.parse(searchParams);

    const googleAuthentication = await completeGoogleOAuthSignIn(
      {
        code: payload.code,
        state: payload.state,
      },
      getRequestMetadata(request),
    );

    const redirectUrl = new URL(googleAuthentication.redirectPath, request.url);
    const response = NextResponse.redirect(redirectUrl, {
      headers: {
        "Cache-Control": "no-store",
      },
    });

    setAuthCookies(response, googleAuthentication.issuedSession);
    return response;
  } catch (error) {
    console.error("Google callback flow failed", error);

    const fallbackStatus =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "GOOGLE_ACCOUNT_CONFLICT"
        ? AUTH_QUERY_STATUSES.googleConflict
        : AUTH_QUERY_STATUSES.oauthCancelled;

    return NextResponse.redirect(buildLoginRedirect(request, fallbackStatus), {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
