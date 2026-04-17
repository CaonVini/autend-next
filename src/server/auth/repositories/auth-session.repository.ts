import type { SessionRevocationReason } from "@prisma/client";
import type { DatabaseClient } from "@/src/server/db/prisma";

type CreateAuthSessionInput = {
  expiresAt: Date;
  familyId: string;
  id: string;
  ipAddress?: string;
  parentSessionId?: string;
  refreshTokenHash: string;
  userAgent?: string;
  userId: string;
};

export const authSessionRepository = {
  create(client: DatabaseClient, input: CreateAuthSessionInput) {
    return client.authSession.create({
      data: {
        expiresAt: input.expiresAt,
        familyId: input.familyId,
        id: input.id,
        ipAddress: input.ipAddress,
        parentSessionId: input.parentSessionId,
        refreshTokenHash: input.refreshTokenHash,
        userAgent: input.userAgent,
        userId: input.userId,
      },
    });
  },

  findById(client: DatabaseClient, sessionId: string) {
    return client.authSession.findUnique({
      include: {
        user: true,
      },
      where: { id: sessionId },
    });
  },

  revoke(client: DatabaseClient, input: {
    replacedBySessionId?: string;
    revocationReason: SessionRevocationReason;
    revokedAt: Date;
    sessionId: string;
  }) {
    return client.authSession.update({
      data: {
        replacedBySessionId: input.replacedBySessionId,
        revokedAt: input.revokedAt,
        revokedReason: input.revocationReason,
      },
      where: { id: input.sessionId },
    });
  },

  revokeFamily(
    client: DatabaseClient,
    familyId: string,
    revokedAt: Date,
    revocationReason: SessionRevocationReason,
  ) {
    return client.authSession.updateMany({
      data: {
        reuseDetectedAt:
          revocationReason === "REUSE_DETECTED" ? revokedAt : undefined,
        revokedAt,
        revokedReason: revocationReason,
      },
      where: {
        familyId,
        revokedAt: null,
      },
    });
  },

  touchLastUsed(client: DatabaseClient, sessionId: string, timestamp: Date) {
    return client.authSession.update({
      data: {
        lastUsedAt: timestamp,
      },
      where: { id: sessionId },
    });
  },
};
