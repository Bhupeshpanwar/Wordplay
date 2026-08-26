import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import { executeOperation, resetDatabase } from "./helpers/executeOperation";
import { prisma } from "../src/db";

async function registerUser(username: string) {
  const result = await executeOperation(
    `
      mutation Register($username: String!) {
        register(username: $username, password: "secret123") {
          user { id username }
        }
      }
    `,
    { username }
  );
  return result.data!.register.user as { id: string; username: string };
}

describe("game results & leaderboard (integration, real Postgres)", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects submitting a score when not authenticated", async () => {
    const result = await executeOperation(
      `mutation { submitScore(value: 4200) { id } }`,
      {},
      null
    );

    expect(result.errors?.[0]?.extensions?.code).toBe("UNAUTHENTICATED");
  });

  it("persists a score for the authenticated user", async () => {
    const user = await registerUser("scorer1");

    const result = await executeOperation(
      `mutation { submitScore(value: 4200) { value user { username } } }`,
      {},
      { userId: user.id, username: user.username }
    );

    expect(result.errors).toBeUndefined();
    expect(result.data?.submitScore.value).toBe(4200);
    expect(result.data?.submitScore.user.username).toBe("scorer1");

    const rows = await prisma.score.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
  });

  it("rejects a negative score", async () => {
    const user = await registerUser("scorer2");

    const result = await executeOperation(
      `mutation { submitScore(value: -5) { id } }`,
      {},
      { userId: user.id, username: user.username }
    );

    expect(result.errors?.[0]?.extensions?.code).toBe("BAD_USER_INPUT");
  });

  it("returns the current user's scores with the fastest time first", async () => {
    const user = await registerUser("scorer3");
    const ctx = { userId: user.id, username: user.username };

    for (const value of [8000, 3200, 5100]) {
      await executeOperation(`mutation($v: Int!) { submitScore(value: $v) { id } }`, { v: value }, ctx);
    }

    const result = await executeOperation(`query { myScores { value } }`, {}, ctx);

    expect(result.data?.myScores.map((s: { value: number }) => s.value)).toEqual([3200, 5100, 8000]);
  });

  it("ranks the leaderboard by each player's personal-best (lowest) time", async () => {
    const alice = await registerUser("alice");
    const bob = await registerUser("bob");
    const aliceCtx = { userId: alice.id, username: alice.username };
    const bobCtx = { userId: bob.id, username: bob.username };

    await executeOperation(`mutation { submitScore(value: 9000) { id } }`, {}, aliceCtx);
    await executeOperation(`mutation { submitScore(value: 4100) { id } }`, {}, aliceCtx); // alice's best
    await executeOperation(`mutation { submitScore(value: 6000) { id } }`, {}, bobCtx); // bob's best

    const result = await executeOperation(`
      query { leaderboard(limit: 5) { bestValue user { username } } }
    `);

    expect(result.errors).toBeUndefined();
    expect(result.data?.leaderboard).toEqual([
      { bestValue: 4100, user: { username: "alice" } },
      { bestValue: 6000, user: { username: "bob" } },
    ]);
  });

  it("respects the leaderboard limit argument", async () => {
    for (const name of ["p1", "p2", "p3"]) {
      const user = await registerUser(name);
      await executeOperation(
        `mutation { submitScore(value: 5000) { id } }`,
        {},
        { userId: user.id, username: user.username }
      );
    }

    const result = await executeOperation(`query { leaderboard(limit: 2) { user { username } } }`);
    expect(result.data?.leaderboard).toHaveLength(2);
  });
});
