import { type NextRequest } from "next/server";
import { handleEmailConfirmation } from "@/src/server/auth/controllers/email-confirmation.controller";
import { withRouteErrorHandling } from "@/src/server/core/http/route-handler";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withRouteErrorHandling(() => handleEmailConfirmation(request));
}
