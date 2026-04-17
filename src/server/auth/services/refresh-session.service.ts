import { Prisma } from "@prisma/client";
import { authSessionRepository } from "@/src/server/auth/repositories/auth-session.repository";
import { userRepository } from "@/src/server/auth/repositories/user.repository";
import {
  assertUserCanAuthenticate,
  buildAuthenticatedUserView,
} from "@/src/server/auth/services/authenticated-session.service";
import { recordAuthAuditEvent } from "@/src/server/auth/services/audit-log.service";
import { issueSessionTokens } from "@/src/server/auth/services/session-token.service";
import { verifyRefreshToken } from "@/src/server/auth/utils/jwt";
import { ApplicationError } from "@/src/server/core/errors/application-error";
import { hashToken, safeCompare } from "@/src/server/core/security/crypto";
import { prisma } from "@/src/server/db/prisma";
import type { RequestMetadata } from "@/src/server/core/security/request-metadata";

function invalidRefreshError() {
  return new ApplicationError({
    code: "INVALID_REFRESH_SESSION",
    publicMessage: "Sua sessao atual nao e valida.",
    statusCode: 401,
  });
}

async function revokeFamilyForReuseDetection(
  familyId: string,
  requestMetadata: RequestMetadata,
  userId?: string,
  email?: string,
) {
  const revokedAt = new Date();

  await authSessionRepository.revokeFamily(prisma, familyId, revokedAt, "REUSE_DETECTED");

  await recordAuthAuditEvent({
    email,
    eventType: "REFRESH_TOKEN_REUSE_DETECTED",
    ipAddress: requestMetadata.ipAddress,
    userAgent: requestMetadata.userAgent,
    userId,
  });
}

export async function rotateRefreshSession(
  rawRefreshToken: string,
  requestMetadata: RequestMetadata,
) {
  const token = await verifyRefreshToken(rawRefreshToken);
  const session = await authSessionRepository.findById(prisma, token.sid);
  const now = new Date();

  if (!session || session.userId !== token.sub || session.familyId !== token.fid) {
    throw invalidRefreshError();
  }

  if (session.revokedAt || session.expiresAt <= now) {
    if (session.revokedReason === "ROTATED" || session.replacedBySessionId) {
      await revokeFamilyForReuseDetection(
        session.familyId,
        requestMetadata,
        session.userId,
        session.user.email,
      );
    }

    throw invalidRefreshError();
  }

  try {
    assertUserCanAuthenticate(session.user);
  } catch {
    await authSessionRepository.revokeFamily(prisma, session.familyId, now, "SECURITY_EVENT");
    throw invalidRefreshError();
  }

  const incomingRefreshHash = hashToken(rawRefreshToken);

  if (!safeCompare(incomingRefreshHash, session.refreshTokenHash)) {
    await revokeFamilyForReuseDetection(
      session.familyId,
      requestMetadata,
      session.userId,
      session.user.email,
    );
    throw invalidRefreshError();
  }

  const rotatedSession = await prisma.$transaction(
    async (transactionClient) => {
      const issuedSession = await issueSessionTokens({
        client: transactionClient,
        familyId: session.familyId,
        ipAddress: requestMetadata.ipAddress,
        issuedAt: now,
        parentSessionId: session.id,
        userAgent: requestMetadata.userAgent,
        userId: session.userId,
      });

      await authSessionRepository.revoke(transactionClient, {
        replacedBySessionId: issuedSession.sessionId,
        revocationReason: "ROTATED",
        revokedAt: now,
        sessionId: session.id,
      });

      await userRepository.touchLastLogin(transactionClient, session.userId, now);

      return issuedSession;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  await recordAuthAuditEvent({
    email: session.user.email,
    eventType: "REFRESH_TOKEN_ROTATED",
    ipAddress: requestMetadata.ipAddress,
    metadata: {
      previousSessionId: session.id,
      sessionId: rotatedSession.sessionId,
    },
    userAgent: requestMetadata.userAgent,
    userId: session.userId,
  });

  return {
    issuedSession: rotatedSession,
    user: buildAuthenticatedUserView(session.user),
  };
}
