import { type NextRequest } from "next/server";
import { handleGoogleCallback } from "@/src/server/auth/controllers/google-callback.controller";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return handleGoogleCallback(request);
}
