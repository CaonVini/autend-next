import type { DatabaseClient } from "@/src/server/db/prisma";

type CreateOauthStateInput = {
  expiresAt: Date;
  nonceHash: string;
  provider: string;
  redirectPath: string;
  requestedFromIp?: string;
  requestedUserAgent?: string;
  stateHash: string;
};

export const oauthStateRepository = {
  create(client: DatabaseClient, input: CreateOauthStateInput) {
    return client.oAuthAuthorizationState.create({
      data: {
        expiresAt: input.expiresAt,
        nonceHash: input.nonceHash,
        provider: input.provider,
        redirectPath: input.redirectPath,
        requestedFromIp: input.requestedFromIp,
        requestedUserAgent: input.requestedUserAgent,
        stateHash: input.stateHash,
      },
    });
  },

  findByStateHash(client: DatabaseClient, stateHash: string) {
    return client.oAuthAuthorizationState.findUnique({
      where: { stateHash },
    });
  },

  markAsConsumed(client: DatabaseClient, oauthStateId: string, consumedAt: Date) {
    return client.oAuthAuthorizationState.update({
      data: {
        consumedAt,
      },
      where: { id: oauthStateId },
    });
  },
};
