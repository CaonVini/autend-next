import type { AuthSession, User } from "@prisma/client";
import { authSessionRepository } from "@/src/server/auth/repositories/auth-session.repository";
import { verifyAccessToken } from "@/src/server/auth/utils/jwt";
import { ApplicationError } from "@/src/server/core/errors/application-error";
import { prisma } from "@/src/server/db/prisma";

type SessionWithUser = NonNullable<Awaited<ReturnType<typeof authSessionRepository.findById>>>;

export type AuthenticatedUserView = {
  companyName?: string;
  email: string;
  id: string;
  name: string;
};

export function buildAuthenticatedUserView(user: User): AuthenticatedUserView {
  return {
    companyName: user.companyName ?? undefined,
    email: user.email,
    id: user.id,
    name: user.name,
  };
}

export function assertUserCanAuthenticate(user: User) {
  if (user.status !== "ACTIVE" || !user.emailVerifiedAt) {
    throw new ApplicationError({
      code: "AUTHENTICATION_REJECTED",
      publicMessage: "Nao foi possivel autenticar com os dados enviados.",
      statusCode: 401,
    });
  }
}

export function assertSessionIsActive(session: AuthSession) {
  const now = new Date();

  if (session.revokedAt || session.expiresAt <= now) {
    throw new ApplicationError({
      code: "SESSION_NOT_ACTIVE",
      publicMessage: "Sua sessao atual nao e valida.",
      statusCode: 401,
    });
  }
}

function assertTokenOwnership(session: SessionWithUser, userId: string) {
  if (session.userId !== userId || session.user.id !== userId) {
    throw new ApplicationError({
      code: "SESSION_OWNER_MISMATCH",
      publicMessage: "Sua sessao atual nao e valida.",
      statusCode: 401,
    });
  }
}

export async function loadSessionFromAccessToken(rawAccessToken: string) {
  const token = await verifyAccessToken(rawAccessToken);
  const session = await authSessionRepository.findById(prisma, token.sid);

  if (!session) {
    throw new ApplicationError({
      code: "SESSION_NOT_FOUND",
      publicMessage: "Sua sessao atual nao e valida.",
      statusCode: 401,
    });
  }

  assertTokenOwnership(session, token.sub);
  assertUserCanAuthenticate(session.user);
  assertSessionIsActive(session);

  return {
    session,
    user: session.user,
  };
}
