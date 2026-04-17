import { ApplicationError } from "@/src/server/core/errors/application-error";
import type { RequestMetadata } from "@/src/server/core/security/request-metadata";
import {
  buildAuthenticatedUserView,
  loadSessionFromAccessToken,
} from "@/src/server/auth/services/authenticated-session.service";
import { rotateRefreshSession } from "@/src/server/auth/services/refresh-session.service";

type ResolveCurrentSessionInput = {
  rawAccessToken?: string;
  rawRefreshToken?: string;
  requestMetadata: RequestMetadata;
};

export async function resolveCurrentSession(input: ResolveCurrentSessionInput) {
  if (input.rawAccessToken) {
    try {
      const activeSession = await loadSessionFromAccessToken(input.rawAccessToken);

      return {
        refreshed: false,
        user: buildAuthenticatedUserView(activeSession.user),
      };
    } catch {
      // The session route can transparently try refresh rotation when the access token is no longer valid.
    }
  }

  if (input.rawRefreshToken) {
    const refreshedSession = await rotateRefreshSession(
      input.rawRefreshToken,
      input.requestMetadata,
    );

    return {
      issuedSession: refreshedSession.issuedSession,
      refreshed: true,
      user: refreshedSession.user,
    };
  }

  throw new ApplicationError({
    code: "SESSION_MISSING",
    publicMessage: "Nenhuma sessao valida foi encontrada.",
    statusCode: 401,
  });
}
