import { authSessionRepository } from "@/src/server/auth/repositories/auth-session.repository";
import { recordAuthAuditEvent } from "@/src/server/auth/services/audit-log.service";
import { verifyAccessToken, verifyRefreshToken } from "@/src/server/auth/utils/jwt";
import { prisma } from "@/src/server/db/prisma";
import type { RequestMetadata } from "@/src/server/core/security/request-metadata";

type LogoutInput = {
  rawAccessToken?: string;
  rawRefreshToken?: string;
  requestMetadata: RequestMetadata;
};

export async function logoutSession(input: LogoutInput) {
  const now = new Date();

  try {
    if (input.rawRefreshToken) {
      const refreshToken = await verifyRefreshToken(input.rawRefreshToken);
      const session = await authSessionRepository.findById(prisma, refreshToken.sid);

      if (session) {
        await authSessionRepository.revokeFamily(prisma, session.familyId, now, "USER_LOGOUT");

        await recordAuthAuditEvent({
          email: session.user.email,
          eventType: "LOGOUT_COMPLETED",
          ipAddress: input.requestMetadata.ipAddress,
          userAgent: input.requestMetadata.userAgent,
          userId: session.userId,
        });
      }

      return;
    }

    if (input.rawAccessToken) {
      const accessToken = await verifyAccessToken(input.rawAccessToken);
      const session = await authSessionRepository.findById(prisma, accessToken.sid);

      if (session && !session.revokedAt) {
        await authSessionRepository.revoke(prisma, {
          revocationReason: "USER_LOGOUT",
          revokedAt: now,
          sessionId: session.id,
        });
      }
    }
  } catch (error) {
    console.error("Logout fallback completed after token verification failure", error);
  }
}
