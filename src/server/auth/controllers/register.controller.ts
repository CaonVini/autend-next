import { NextResponse, type NextRequest } from "next/server";
import { registerRequestSchema } from "@/src/modules/auth/schemas/auth-request.schemas";
import {
  registerPendingUser,
  REGISTRATION_ACCEPTED_MESSAGE,
} from "@/src/server/auth/services/registration.service";
import { parseJsonRequest } from "@/src/server/core/http/request-parsing";
import { assertCsrfProtection } from "@/src/server/core/security/csrf";
import { getRequestMetadata } from "@/src/server/core/security/request-metadata";

export async function handleRegisterRequest(request: NextRequest) {
  assertCsrfProtection(request);

  const payload = await parseJsonRequest(request, registerRequestSchema);
  const registrationResult = await registerPendingUser(payload, getRequestMetadata(request));

  return NextResponse.json(
    {
      data: {
        message: registrationResult.message ?? REGISTRATION_ACCEPTED_MESSAGE,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 202,
    },
  );
}
