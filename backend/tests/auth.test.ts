import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { executeOperation, resetDatabase } from "./helpers/executeOperation";
import { prisma } from "../src/db";

describe("authentication (integration, real Postgres)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registers a new user and returns a token", async () => {
    const result = await executeOperation(`
      mutation {
        register(username: "player1", password: "secret123") {
          token
          user { username }
        }
      }
    `);

    expect(result.errors).toBeUndefined();
    expect(result.data?.register.user.username).toBe("player1");
    expect(typeof result.data?.register.token).toBe("string");

    const stored = await prisma.user.findUnique({ where: { username: "player1" } });
    expect(stored).not.toBeNull();
    // The plaintext password must never be stored.
    expect(stored?.passwordHash).not.toBe("secret123");
  });

  it("rejects registering a duplicate username", async () => {
    await executeOperation(`
      mutation { register(username: "player1", password: "secret123") { token } }
    `);

    const result = await executeOperation(`
      mutation { register(username: "player1", password: "different1") { token } }
    `);

    expect(result.data?.register).toBeNull();
    expect(result.errors?.[0]?.extensions?.code).toBe("CONFLICT");
  });

  it("rejects registration with a short password", async () => {
    const result = await executeOperation(`
      mutation { register(username: "player2", password: "abc") { token } }
    `);
    expect(result.errors?.[0]?.extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("rejects registration with an invalid username", async () => {
    const result = await executeOperation(`
      mutation { register(username: "no spaces!", password: "secret123") { token } }
    `);
    expect(result.errors?.[0]?.extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("logs in with correct credentials", async () => {
    await executeOperation(`
      mutation { register(username: "player3", password: "secret123") { token } }
    `);

    const result = await executeOperation(`
      mutation { login(username: "player3", password: "secret123") { token user { username } } }
    `);

    expect(result.errors).toBeUndefined();
    expect(result.data?.login.user.username).toBe("player3");
  });

  it("rejects login with a wrong password", async () => {
    await executeOperation(`
      mutation { register(username: "player4", password: "secret123") { token } }
    `);

    const result = await executeOperation(`
      mutation { login(username: "player4", password: "wrongpass") { token } }
    `);

    expect(result.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
  });

  it("rejects login for a username that doesn't exist", async () => {
    const result = await executeOperation(`
      mutation { login(username: "ghost", password: "secret123") { token } }
    `);

    expect(result.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
  });
});
