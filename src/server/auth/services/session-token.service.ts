import { randomUUID } from "node:crypto";
import { prisma, type DatabaseClient } from "@/src/server/db/prisma";
import { getEnv } from "@/src/server/config/env";
import { authSessionRepository } from "@/src/server/auth/repositories/auth-session.repository";
import { hashToken } from "@/src/server/core/security/crypto";
import { signAccessToken, signRefreshToken } from "@/src/server/auth/utils/jwt";

type SessionIssueInput = {
  client?: DatabaseClient;
  familyId?: string;
  ipAddress?: string;
  issuedAt?: Date;
  parentSessionId?: string;
  userAgent?: string;
  userId: string;
};

export type IssuedSessionTokens = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  familyId: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  sessionId: string;
};

export async function issueSessionTokens(input: SessionIssueInput): Promise<IssuedSessionTokens> {
  const client = input.client ?? prisma;
  const env = getEnv();
  const issuedAt = input.issuedAt ?? new Date();
  const sessionId = randomUUID();
  const familyId = input.familyId ?? randomUUID();
  const accessTokenExpiresAt = new Date(
    issuedAt.getTime() + env.ACCESS_TOKEN_TTL_MINUTES * 60 * 1000,
  );
  const refreshTokenExpiresAt = new Date(
    issuedAt.getTime() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const refreshToken = await signRefreshToken({
    familyId,
    sessionId,
    userId: input.userId,
  });

  const accessToken = await signAccessToken({
    sessionId,
    userId: input.userId,
  });

  await authSessionRepository.create(client, {
    expiresAt: refreshTokenExpiresAt,
    familyId,
    id: sessionId,
    ipAddress: input.ipAddress,
    parentSessionId: input.parentSessionId,
    refreshTokenHash: hashToken(refreshToken),
    userAgent: input.userAgent,
    userId: input.userId,
  });

  return {
    accessToken,
    accessTokenExpiresAt,
    familyId,
    refreshToken,
    refreshTokenExpiresAt,
    sessionId,
  };
}
