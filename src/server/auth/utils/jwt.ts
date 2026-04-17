import { jwtVerify, SignJWT } from "jose";
import { AUTH_JWT_AUDIENCES, AUTH_JWT_TYPES } from "@/src/server/auth/constants/auth.constants";
import { ApplicationError } from "@/src/server/core/errors/application-error";
import { getEnv } from "@/src/server/config/env";

type AccessTokenClaims = {
  sid: string;
  sub: string;
  typ: typeof AUTH_JWT_TYPES.access;
};

type RefreshTokenClaims = {
  fid: string;
  sid: string;
  sub: string;
  typ: typeof AUTH_JWT_TYPES.refresh;
};

function accessTokenSecret() {
  return new TextEncoder().encode(getEnv().ACCESS_TOKEN_SECRET);
}

function refreshTokenSecret() {
  return new TextEncoder().encode(getEnv().REFRESH_TOKEN_SECRET);
}

export async function signAccessToken(input: { sessionId: string; userId: string }) {
  const env = getEnv();

  return new SignJWT({
    sid: input.sessionId,
    typ: AUTH_JWT_TYPES.access,
  })
    .setAudience(AUTH_JWT_AUDIENCES.access)
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_MINUTES}m`)
    .setIssuedAt()
    .setIssuer(env.APP_URL)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .sign(accessTokenSecret());
}

export async function signRefreshToken(input: {
  familyId: string;
  sessionId: string;
  userId: string;
}) {
  const env = getEnv();

  return new SignJWT({
    fid: input.familyId,
    sid: input.sessionId,
    typ: AUTH_JWT_TYPES.refresh,
  })
    .setAudience(AUTH_JWT_AUDIENCES.refresh)
    .setExpirationTime(`${env.REFRESH_TOKEN_TTL_DAYS}d`)
    .setIssuedAt()
    .setIssuer(env.APP_URL)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .sign(refreshTokenSecret());
}

function assertTokenShape<TPayload extends { sid?: unknown; typ?: unknown; fid?: unknown; sub?: unknown }>(
  payload: TPayload,
  tokenType: "access" | "refresh",
): asserts payload is TPayload & {
  fid?: string;
  sid: string;
  sub: string;
  typ: string;
} {
  if (typeof payload.sub !== "string" || typeof payload.sid !== "string") {
    throw new ApplicationError({
      code: "INVALID_TOKEN_PAYLOAD",
      publicMessage: "A sessao atual nao e valida.",
      statusCode: 401,
    });
  }

  if (payload.typ !== AUTH_JWT_TYPES[tokenType]) {
    throw new ApplicationError({
      code: "INVALID_TOKEN_TYPE",
      publicMessage: "A sessao atual nao e valida.",
      statusCode: 401,
    });
  }

  if (tokenType === "refresh" && typeof payload.fid !== "string") {
    throw new ApplicationError({
      code: "INVALID_REFRESH_TOKEN_PAYLOAD",
      publicMessage: "A sessao atual nao e valida.",
      statusCode: 401,
    });
  }
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  try {
    const result = await jwtVerify(token, accessTokenSecret(), {
      audience: AUTH_JWT_AUDIENCES.access,
      issuer: getEnv().APP_URL,
    });

    const payload = result.payload;
    assertTokenShape(payload, "access");

    return {
      sid: payload.sid,
      sub: payload.sub,
      typ: AUTH_JWT_TYPES.access,
    };
  } catch (error) {
    throw new ApplicationError({
      cause: error,
      code: "INVALID_ACCESS_TOKEN",
      publicMessage: "A sessao atual nao e valida.",
      statusCode: 401,
    });
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenClaims> {
  try {
    const result = await jwtVerify(token, refreshTokenSecret(), {
      audience: AUTH_JWT_AUDIENCES.refresh,
      issuer: getEnv().APP_URL,
    });

    const payload = result.payload;
    assertTokenShape(payload, "refresh");

    return {
      fid: payload.fid!,
      sid: payload.sid,
      sub: payload.sub,
      typ: AUTH_JWT_TYPES.refresh,
    };
  } catch (error) {
    throw new ApplicationError({
      cause: error,
      code: "INVALID_REFRESH_TOKEN",
      publicMessage: "A sessao atual nao e valida.",
      statusCode: 401,
    });
  }
}
