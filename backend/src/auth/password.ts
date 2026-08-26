// Bun ships a native, fast implementation of password hashing (argon2id by
// default) — no extra native dependency needed, which keeps this portable
// across the Docker image and local dev.

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: "argon2id" });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
