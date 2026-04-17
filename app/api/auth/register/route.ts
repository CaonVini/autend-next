import { type NextRequest } from "next/server";
import { handleRegisterRequest } from "@/src/server/auth/controllers/register.controller";
import { withRouteErrorHandling } from "@/src/server/core/http/route-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withRouteErrorHandling(() => handleRegisterRequest(request));
}
