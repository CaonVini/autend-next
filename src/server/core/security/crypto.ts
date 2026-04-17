import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/src/server/config/env";

export function generateSecureToken(bytes = 48) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHmac("sha256", getEnv().TOKEN_HASH_SECRET).update(token).digest("hex");
}

export function safeCompare(leftValue: string, rightValue: string) {
  const leftDigest = createHash("sha256").update(leftValue).digest();
  const rightDigest = createHash("sha256").update(rightValue).digest();

  return timingSafeEqual(leftDigest, rightDigest);
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
