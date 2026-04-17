import { type NextRequest } from "next/server";
import { handleGoogleAuthorize } from "@/src/server/auth/controllers/google-authorize.controller";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return handleGoogleAuthorize(request);
}
