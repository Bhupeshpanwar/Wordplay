import { hashPassword, verifyPassword } from "../auth/password";
import { signToken } from "../auth/jwt";
import { credentialsSchema, scoreSchema, leaderboardLimitSchema } from "../validation/schemas";
import { badUserInput, unauthenticated, conflict, formatZodError } from "../errors";
import type { GraphQLContext } from "./context";

interface LeaderboardRow {
  id: string;
  username: string;
  createdAt: Date;
  bestValue: number;
  achievedAt: Date;
}

export const resolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.currentUser) return null;
      return ctx.prisma.user.findUnique({ where: { id: ctx.currentUser.userId } });
    },

    myScores: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw unauthenticated();
      return ctx.prisma.score.findMany({
        where: { userId: ctx.currentUser.userId },
        // Lower time = better, so ascending puts the player's best run first.
        orderBy: { value: "asc" },
        include: { user: true },
      });
    },

    leaderboard: async (_: unknown, args: { limit?: number | null }, ctx: GraphQLContext) => {
      const parsedLimit = leaderboardLimitSchema.safeParse(args.limit ?? 10);
      if (!parsedLimit.success) throw badUserInput(formatZodError(parsedLimit.error));
      const limit = parsedLimit.data;

      // Rank every player by their personal-best (lowest) time, fastest first.
      const rows = await ctx.prisma.$queryRaw<LeaderboardRow[]>`
        WITH best AS (
          SELECT "userId", MIN(value) AS "bestValue"
          FROM "Score"
          GROUP BY "userId"
        )
        SELECT u.id, u.username, u."createdAt", b."bestValue",
          (
            SELECT s."createdAt" FROM "Score" s
            WHERE s."userId" = u.id AND s.value = b."bestValue"
            ORDER BY s."createdAt" ASC LIMIT 1
          ) AS "achievedAt"
        FROM best b
        JOIN "User" u ON u.id = b."userId"
        ORDER BY b."bestValue" ASC
        LIMIT ${limit}
      `;

      return rows.map((row) => ({
        user: { id: row.id, username: row.username, createdAt: row.createdAt },
        bestValue: row.bestValue,
        achievedAt: row.achievedAt,
      }));
    },
  },

  Mutation: {
    register: async (_: unknown, args: { username: string; password: string }, ctx: GraphQLContext) => {
      const parsed = credentialsSchema.safeParse(args);
      if (!parsed.success) throw badUserInput(formatZodError(parsed.error));

      const existing = await ctx.prisma.user.findUnique({
        where: { username: parsed.data.username },
      });
      if (existing) throw conflict("That username is already taken");

      const passwordHash = await hashPassword(parsed.data.password);
      const user = await ctx.prisma.user.create({
        data: { username: parsed.data.username, passwordHash },
      });

      const token = signToken({ userId: user.id, username: user.username });
      return { token, user };
    },

    login: async (_: unknown, args: { username: string; password: string }, ctx: GraphQLContext) => {
      if (!args.username?.trim() || !args.password) {
        throw badUserInput("Username and password are required");
      }

      const user = await ctx.prisma.user.findUnique({
        where: { username: args.username.trim() },
      });
      // Same message for "no such user" and "wrong password" so we don't
      // leak which usernames exist.
      if (!user) throw unauthenticated("Invalid username or password");

      const valid = await verifyPassword(args.password, user.passwordHash);
      if (!valid) throw unauthenticated("Invalid username or password");

      const token = signToken({ userId: user.id, username: user.username });
      return { token, user };
    },

    submitScore: async (_: unknown, args: { value: number }, ctx: GraphQLContext) => {
      if (!ctx.currentUser) throw unauthenticated();

      const parsed = scoreSchema.safeParse(args.value);
      if (!parsed.success) throw badUserInput(formatZodError(parsed.error));

      // The userId always comes from the verified JWT in context, never from
      // client input — this stops a player from submitting scores as someone
      // else.
      return ctx.prisma.score.create({
        data: { value: parsed.data, userId: ctx.currentUser.userId },
        include: { user: true },
      });
    },
  },

  User: {
    createdAt: (parent: { createdAt: Date | string }) => new Date(parent.createdAt).toISOString(),
  },

  Score: {
    createdAt: (parent: { createdAt: Date | string }) => new Date(parent.createdAt).toISOString(),
  },

  LeaderboardEntry: {
    achievedAt: (parent: { achievedAt: Date | string }) => new Date(parent.achievedAt).toISOString(),
  },
};
