import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/src/modules/auth/auth-cookie.constants";

function generateCsrfToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
}

function isSecureRequest(request: NextRequest) {
  return request.nextUrl.protocol === "https:";
}

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");

  if (!request.cookies.get(AUTH_COOKIE_NAMES.csrfToken)?.value) {
    response.cookies.set({
      httpOnly: false,
      name: AUTH_COOKIE_NAMES.csrfToken,
      path: "/",
      sameSite: "lax",
      secure: isSecureRequest(request),
      value: generateCsrfToken(),
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
