import { type NextRequest } from "next/server";
import { handleLogout } from "@/src/server/auth/controllers/logout.controller";
import { withRouteErrorHandling } from "@/src/server/core/http/route-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withRouteErrorHandling(() => handleLogout(request));
}
