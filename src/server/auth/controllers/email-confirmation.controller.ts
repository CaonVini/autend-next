import { NextResponse, type NextRequest } from "next/server";
import { AUTH_QUERY_STATUSES } from "@/src/server/auth/constants/auth.constants";
import { emailVerificationTokenSchema } from "@/src/modules/auth/schemas/auth-request.schemas";
import { confirmPendingRegistration } from "@/src/server/auth/services/email-confirmation.service";

export async function handleEmailConfirmation(request: NextRequest) {
  const redirectUrl = new URL("/", request.url);
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());

  try {
    const payload = emailVerificationTokenSchema.parse(searchParams);
    const confirmationResult = await confirmPendingRegistration(payload.token);

    redirectUrl.searchParams.set(
      "auth",
      confirmationResult.success
        ? AUTH_QUERY_STATUSES.emailVerified
        : AUTH_QUERY_STATUSES.verificationInvalid,
    );
  } catch {
    redirectUrl.searchParams.set("auth", AUTH_QUERY_STATUSES.verificationInvalid);
  }

  return NextResponse.redirect(redirectUrl, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
