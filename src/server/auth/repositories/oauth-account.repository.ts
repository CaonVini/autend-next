import type { DatabaseClient } from "@/src/server/db/prisma";

type CreateOAuthAccountInput = {
  provider: string;
  providerAccountId: string;
  providerAvatarUrl?: string;
  providerDisplayName?: string;
  providerEmail?: string;
  userId: string;
};

export const oauthAccountRepository = {
  create(client: DatabaseClient, input: CreateOAuthAccountInput) {
    return client.oAuthAccount.create({
      data: {
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        providerAvatarUrl: input.providerAvatarUrl,
        providerDisplayName: input.providerDisplayName,
        providerEmail: input.providerEmail,
        userId: input.userId,
      },
    });
  },

  findByProviderAccountId(client: DatabaseClient, provider: string, providerAccountId: string) {
    return client.oAuthAccount.findUnique({
      include: {
        user: true,
      },
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId,
        },
      },
    });
  },

  findByUserId(client: DatabaseClient, userId: string) {
    return client.oAuthAccount.findMany({
      where: { userId },
    });
  },

  touchLastUsed(client: DatabaseClient, oauthAccountId: string, lastUsedAt: Date) {
    return client.oAuthAccount.update({
      data: {
        lastUsedAt,
      },
      where: { id: oauthAccountId },
    });
  },
};
