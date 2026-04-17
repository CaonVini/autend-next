import { OAuth2Client } from "google-auth-library";
import { AUTH_PROVIDER_NAMES } from "@/src/server/auth/constants/auth.constants";
import { ApplicationError } from "@/src/server/core/errors/application-error";
import { getEnv } from "@/src/server/config/env";

export type GoogleIdentity = {
  avatarUrl?: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  nonce?: string;
  subject: string;
};

let cachedGoogleClient: OAuth2Client | null = null;

function getGoogleOAuthClient() {
  if (cachedGoogleClient) {
    return cachedGoogleClient;
  }

  const env = getEnv();

  cachedGoogleClient = new OAuth2Client({
    clientId: env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: env.GOOGLE_OAUTH_REDIRECT_URL,
  });

  return cachedGoogleClient;
}

export function buildGoogleAuthorizationUrl(input: { nonce: string; state: string }) {
  const client = getGoogleOAuthClient();

  return client.generateAuthUrl({
    access_type: "online",
    nonce: input.nonce,
    prompt: "select_account",
    response_type: "code",
    scope: ["openid", "email", "profile"],
    state: input.state,
  });
}

export async function exchangeCodeForGoogleIdentity(code: string): Promise<GoogleIdentity> {
  const client = getGoogleOAuthClient();
  const env = getEnv();

  const tokenResponse = await client.getToken({
    code,
    redirect_uri: env.GOOGLE_OAUTH_REDIRECT_URL,
  });

  if (!tokenResponse.tokens.id_token) {
    throw new ApplicationError({
      code: "GOOGLE_ID_TOKEN_MISSING",
      publicMessage: "Nao foi possivel concluir a autenticacao com Google.",
      statusCode: 401,
    });
  }

  const ticket = await client.verifyIdToken({
    audience: env.GOOGLE_OAUTH_CLIENT_ID,
    idToken: tokenResponse.tokens.id_token,
  });

  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new ApplicationError({
      code: "GOOGLE_PROFILE_INCOMPLETE",
      publicMessage: "Nao foi possivel concluir a autenticacao com Google.",
      statusCode: 401,
    });
  }

  return {
    avatarUrl: payload.picture ?? undefined,
    email: payload.email.toLowerCase(),
    emailVerified: Boolean(payload.email_verified),
    name: payload.name ?? undefined,
    nonce: payload.nonce ?? undefined,
    subject: payload.sub,
  };
}

export function googleProviderName() {
  return AUTH_PROVIDER_NAMES.google;
}
