import { type NextRequest } from "next/server";
import { handleCredentialLogin } from "@/src/server/auth/controllers/login.controller";
import { withRouteErrorHandling } from "@/src/server/core/http/route-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withRouteErrorHandling(() => handleCredentialLogin(request));
}
