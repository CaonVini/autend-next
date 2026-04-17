import { type NextRequest } from "next/server";
import { handleRefreshSession } from "@/src/server/auth/controllers/refresh.controller";
import { withRouteErrorHandling } from "@/src/server/core/http/route-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return withRouteErrorHandling(() => handleRefreshSession(request));
}
