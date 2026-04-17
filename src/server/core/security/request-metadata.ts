import type { NextRequest } from "next/server";

export type RequestMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

export function getRequestMetadata(request: NextRequest): RequestMetadata {
  const forwardedForHeader = request.headers.get("x-forwarded-for");
  const realIpHeader = request.headers.get("x-real-ip");
  const userAgentHeader = request.headers.get("user-agent");

  const ipAddress = forwardedForHeader?.split(",")[0]?.trim() || realIpHeader || undefined;
  const userAgent = userAgentHeader?.slice(0, 512) || undefined;

  return {
    ipAddress,
    userAgent,
  };
}
