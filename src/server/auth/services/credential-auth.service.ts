import { getEnv } from "@/src/server/config/env";
import { AUTH_RATE_LIMIT_PREFIXES } from "@/src/server/auth/constants/auth.constants";
import { userRepository } from "@/src/server/auth/repositories/user.repository";
import { buildAuthenticatedUserView, assertUserCanAuthenticate } from "@/src/server/auth/services/authenticated-session.service";
import { recordAuthAuditEvent } from "@/src/server/auth/services/audit-log.service";
import { issueSessionTokens } from "@/src/server/auth/services/session-token.service";
import { verifyPasswordOrDummy } from "@/src/server/auth/utils/password";
import { ApplicationError } from "@/src/server/core/errors/application-error";
import { enforceRateLimit, resetRateLimit } from "@/src/server/core/security/rate-limit";
import { prisma } from "@/src/server/db/prisma";
import type { CredentialLoginInput } from "@/src/modules/auth/schemas/auth-request.schemas";
import type { RequestMetadata } from "@/src/server/core/security/request-metadata";

function invalidCredentialsError() {
  return new ApplicationError({
    code: "INVALID_CREDENTIALS",
    publicMessage: "Nao foi possivel autenticar com os dados enviados.",
    statusCode: 401,
  });
}

export async function authenticateWithCredentials(
  input: CredentialLoginInput,
  requestMetadata: RequestMetadata,
) {
  const env = getEnv();
  const ipAddress = requestMetadata.ipAddress ?? "unknown";

  await enforceRateLimit({
    durationSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
    key: input.email,
    keyPrefix: AUTH_RATE_LIMIT_PREFIXES.loginByEmail,
    maxAttempts: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  });

  await enforceRateLimit({
    durationSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
    key: ipAddress,
    keyPrefix: AUTH_RATE_LIMIT_PREFIXES.loginByIp,
    maxAttempts: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  });

  const user = await userRepository.findByEmail(prisma, input.email);
  const passwordMatches = await verifyPasswordOrDummy(input.password, user?.passwordHash);

  if (!user || !user.passwordHash || !passwordMatches) {
    await recordAuthAuditEvent({
      email: input.email,
      eventType: "LOGIN_REJECTED_INVALID_CREDENTIALS",
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
    });

    throw invalidCredentialsError();
  }

  try {
    assertUserCanAuthenticate(user);
  } catch {
    await recordAuthAuditEvent({
      email: input.email,
      eventType: "LOGIN_REJECTED_USER_NOT_ELIGIBLE",
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      userId: user.id,
    });

    throw invalidCredentialsError();
  }

  const issuedAt = new Date();
  const issuedSession = await issueSessionTokens({
    ipAddress: requestMetadata.ipAddress,
    issuedAt,
    userAgent: requestMetadata.userAgent,
    userId: user.id,
  });

  await userRepository.touchLastLogin(prisma, user.id, issuedAt);

  await resetRateLimit({
    durationSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
    key: input.email,
    keyPrefix: AUTH_RATE_LIMIT_PREFIXES.loginByEmail,
    maxAttempts: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  });

  await resetRateLimit({
    durationSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
    key: ipAddress,
    keyPrefix: AUTH_RATE_LIMIT_PREFIXES.loginByIp,
    maxAttempts: env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  });

  await recordAuthAuditEvent({
    email: user.email,
    eventType: "LOGIN_ACCEPTED",
    ipAddress: requestMetadata.ipAddress,
    metadata: {
      sessionId: issuedSession.sessionId,
    },
    userAgent: requestMetadata.userAgent,
    userId: user.id,
  });

  return {
    issuedSession,
    user: buildAuthenticatedUserView(user),
  };
}
