import { type NextRequest } from "next/server";
import { handleCurrentSession } from "@/src/server/auth/controllers/session.controller";
import { withRouteErrorHandling } from "@/src/server/core/http/route-handler";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return withRouteErrorHandling(() => handleCurrentSession(request));
}
