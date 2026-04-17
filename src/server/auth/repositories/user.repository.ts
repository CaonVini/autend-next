import type { Prisma, User } from "@prisma/client";
import type { DatabaseClient } from "@/src/server/db/prisma";

type CreateCredentialUserInput = {
  companyName?: string;
  email: string;
  emailVerifiedAt: Date;
  name: string;
  passwordHash: string;
};

type CreateGoogleUserInput = {
  companyName?: string;
  email: string;
  emailVerifiedAt: Date;
  name: string;
};

export const userRepository = {
  createCredentialUser(client: DatabaseClient, input: CreateCredentialUserInput) {
    return client.user.create({
      data: {
        companyName: input.companyName,
        email: input.email,
        emailVerifiedAt: input.emailVerifiedAt,
        name: input.name,
        passwordHash: input.passwordHash,
        passwordUpdatedAt: input.emailVerifiedAt,
      },
    });
  },

  createGoogleUser(client: DatabaseClient, input: CreateGoogleUserInput) {
    return client.user.create({
      data: {
        companyName: input.companyName,
        email: input.email,
        emailVerifiedAt: input.emailVerifiedAt,
        name: input.name,
      },
    });
  },

  findByEmail(client: DatabaseClient, email: string) {
    return client.user.findUnique({
      where: { email },
    });
  },

  findById(client: DatabaseClient, id: string) {
    return client.user.findUnique({
      where: { id },
    });
  },

  touchLastLogin(client: DatabaseClient, userId: string, timestamp: Date) {
    return client.user.update({
      data: {
        lastLoginAt: timestamp,
      },
      where: { id: userId },
    });
  },

  updateProfileFromGoogle(client: DatabaseClient, userId: string, data: Prisma.UserUpdateInput) {
    return client.user.update({
      data,
      where: { id: userId },
    });
  },
};

export type AuthUser = User;
