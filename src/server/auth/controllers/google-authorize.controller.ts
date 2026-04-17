import { NextResponse, type NextRequest } from "next/server";
import { AUTH_QUERY_STATUSES } from "@/src/server/auth/constants/auth.constants";
import { googleAuthorizationQuerySchema } from "@/src/modules/auth/schemas/auth-request.schemas";
import { beginGoogleOAuthSignIn } from "@/src/server/auth/services/google-oauth.service";
import { getRequestMetadata } from "@/src/server/core/security/request-metadata";

export async function handleGoogleAuthorize(request: NextRequest) {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
    const payload = googleAuthorizationQuerySchema.parse(searchParams);
    const googleAuthorization = await beginGoogleOAuthSignIn(
      payload.redirectTo,
      getRequestMetadata(request),
    );

    return NextResponse.redirect(googleAuthorization.authorizationUrl, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Google authorize flow failed", error);

    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("auth", AUTH_QUERY_STATUSES.oauthCancelled);
    return NextResponse.redirect(redirectUrl, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }
}
