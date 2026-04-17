import { Prisma } from "@prisma/client";
import { AUTH_PROVIDER_NAMES } from "@/src/server/auth/constants/auth.constants";
import { oauthAccountRepository } from "@/src/server/auth/repositories/oauth-account.repository";
import { oauthStateRepository } from "@/src/server/auth/repositories/oauth-state.repository";
import { userRepository } from "@/src/server/auth/repositories/user.repository";
import {
  assertUserCanAuthenticate,
  buildAuthenticatedUserView,
} from "@/src/server/auth/services/authenticated-session.service";
import { recordAuthAuditEvent } from "@/src/server/auth/services/audit-log.service";
import { issueSessionTokens } from "@/src/server/auth/services/session-token.service";
import {
  buildGoogleAuthorizationUrl,
  exchangeCodeForGoogleIdentity,
} from "@/src/server/auth/utils/google-oauth";
import { ApplicationError } from "@/src/server/core/errors/application-error";
import { sanitizeRelativeRedirectPath } from "@/src/server/core/http/safe-redirect";
import {
  generateSecureToken,
  hashToken,
  safeCompare,
} from "@/src/server/core/security/crypto";
import { prisma } from "@/src/server/db/prisma";
import { getEnv } from "@/src/server/config/env";
import type { RequestMetadata } from "@/src/server/core/security/request-metadata";

export async function beginGoogleOAuthSignIn(
  redirectTo: string | undefined,
  requestMetadata: RequestMetadata,
) {
  const env = getEnv();
  const state = generateSecureToken(32);
  const nonce = generateSecureToken(32);
  const redirectPath = sanitizeRelativeRedirectPath(redirectTo);
  const now = new Date();

  await oauthStateRepository.create(prisma, {
    expiresAt: new Date(now.getTime() + env.GOOGLE_OAUTH_STATE_TTL_MINUTES * 60 * 1000),
    nonceHash: hashToken(nonce),
    provider: AUTH_PROVIDER_NAMES.google,
    redirectPath,
    requestedFromIp: requestMetadata.ipAddress,
    requestedUserAgent: requestMetadata.userAgent,
    stateHash: hashToken(state),
  });

  await recordAuthAuditEvent({
    eventType: "GOOGLE_OAUTH_STARTED",
    ipAddress: requestMetadata.ipAddress,
    metadata: {
      redirectPath,
    },
    userAgent: requestMetadata.userAgent,
  });

  return {
    authorizationUrl: buildGoogleAuthorizationUrl({
      nonce,
      state,
    }),
  };
}

export async function completeGoogleOAuthSignIn(
  input: { code: string; state: string },
  requestMetadata: RequestMetadata,
) {
  const now = new Date();
  const stateHash = hashToken(input.state);
  const oauthState = await oauthStateRepository.findByStateHash(prisma, stateHash);

  if (!oauthState || oauthState.consumedAt || oauthState.expiresAt <= now) {
    throw new ApplicationError({
      code: "GOOGLE_OAUTH_STATE_INVALID",
      publicMessage: "Nao foi possivel concluir a autenticacao com Google.",
      statusCode: 401,
    });
  }

  await oauthStateRepository.markAsConsumed(prisma, oauthState.id, now);

  const googleIdentity = await exchangeCodeForGoogleIdentity(input.code);

  if (!googleIdentity.emailVerified || !googleIdentity.nonce) {
    throw new ApplicationError({
      code: "GOOGLE_EMAIL_NOT_VERIFIED",
      publicMessage: "Nao foi possivel concluir a autenticacao com Google.",
      statusCode: 401,
    });
  }

  if (!safeCompare(hashToken(googleIdentity.nonce), oauthState.nonceHash)) {
    throw new ApplicationError({
      code: "GOOGLE_OAUTH_NONCE_INVALID",
      publicMessage: "Nao foi possivel concluir a autenticacao com Google.",
      statusCode: 401,
    });
  }

  const existingOauthAccount = await oauthAccountRepository.findByProviderAccountId(
    prisma,
    AUTH_PROVIDER_NAMES.google,
    googleIdentity.subject,
  );

  let authenticatedUser = existingOauthAccount?.user;
  let createdFromGoogle = false;

  if (existingOauthAccount) {
    assertUserCanAuthenticate(existingOauthAccount.user);
    await oauthAccountRepository.touchLastUsed(prisma, existingOauthAccount.id, now);
  } else {
    const existingUser = await userRepository.findByEmail(prisma, googleIdentity.email);

    if (existingUser?.passwordHash) {
      throw new ApplicationError({
        code: "GOOGLE_ACCOUNT_CONFLICT",
        publicMessage:
          "Este email ja esta vinculado a uma conta com senha. Entre com email e senha para continuar.",
        statusCode: 409,
      });
    }

    authenticatedUser = await prisma.$transaction(
      async (transactionClient) => {
        const linkedOrCreatedUser =
          existingUser ??
          (await userRepository.createGoogleUser(transactionClient, {
            email: googleIdentity.email,
            emailVerifiedAt: now,
            name: googleIdentity.name ?? googleIdentity.email.split("@")[0],
          }));

        await oauthAccountRepository.create(transactionClient, {
          provider: AUTH_PROVIDER_NAMES.google,
          providerAccountId: googleIdentity.subject,
          providerAvatarUrl: googleIdentity.avatarUrl,
          providerDisplayName: googleIdentity.name,
          providerEmail: googleIdentity.email,
          userId: linkedOrCreatedUser.id,
        });

        return linkedOrCreatedUser;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    createdFromGoogle = !existingUser;
  }

  if (!authenticatedUser) {
    throw new ApplicationError({
      code: "GOOGLE_USER_RESOLUTION_FAILED",
      publicMessage: "Nao foi possivel concluir a autenticacao com Google.",
      statusCode: 401,
    });
  }

  if (createdFromGoogle) {
    await recordAuthAuditEvent({
      email: authenticatedUser.email,
      eventType: "GOOGLE_ACCOUNT_CREATED",
      ipAddress: requestMetadata.ipAddress,
      userAgent: requestMetadata.userAgent,
      userId: authenticatedUser.id,
    });
  }

  assertUserCanAuthenticate(authenticatedUser);

  const issuedSession = await issueSessionTokens({
    ipAddress: requestMetadata.ipAddress,
    issuedAt: now,
    userAgent: requestMetadata.userAgent,
    userId: authenticatedUser.id,
  });

  await userRepository.touchLastLogin(prisma, authenticatedUser.id, now);

  await recordAuthAuditEvent({
    email: authenticatedUser.email,
    eventType: "GOOGLE_LOGIN_ACCEPTED",
    ipAddress: requestMetadata.ipAddress,
    metadata: {
      sessionId: issuedSession.sessionId,
    },
    userAgent: requestMetadata.userAgent,
    userId: authenticatedUser.id,
  });

  return {
    issuedSession,
    redirectPath: oauthState.redirectPath,
    user: buildAuthenticatedUserView(authenticatedUser),
  };
}
