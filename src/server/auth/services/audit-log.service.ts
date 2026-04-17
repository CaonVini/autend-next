import { authAuditRepository } from "@/src/server/auth/repositories/auth-audit.repository";
import { prisma } from "@/src/server/db/prisma";

type AuditLogInput = Parameters<typeof authAuditRepository.create>[1];

export async function recordAuthAuditEvent(input: AuditLogInput) {
  try {
    await authAuditRepository.create(prisma, input);
  } catch (error) {
    console.error("Failed to persist auth audit event", error);
  }
}
