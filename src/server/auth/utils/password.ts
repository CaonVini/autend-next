import argon2 from "argon2";

const passwordHashOptions: argon2.Options & { raw?: false } = {
  memoryCost: 19_456,
  parallelism: 1,
  timeCost: 2,
  type: argon2.argon2id,
};

let dummyHashPromise: Promise<string> | null = null;

async function getDummyPasswordHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = argon2.hash("autend-dummy-password", passwordHashOptions);
  }

  return dummyHashPromise;
}

export async function hashPassword(password: string) {
  return argon2.hash(password, passwordHashOptions);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return argon2.verify(passwordHash, password, passwordHashOptions);
}

export async function verifyPasswordOrDummy(password: string, passwordHash?: string | null) {
  if (!passwordHash) {
    await argon2.verify(await getDummyPasswordHash(), password, passwordHashOptions).catch(() => false);
    return false;
  }

  return verifyPassword(password, passwordHash);
}
