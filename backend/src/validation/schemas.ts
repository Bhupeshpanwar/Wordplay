import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password must be at most 72 characters");

export const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

// The game score is the completion time in MILLISECONDS (lower is better) —
// the frontend times how fast the player types 20 correct letters, with a
// +500ms penalty per wrong key. This just guards against garbage/negative/
// absurd values reaching the database (10 minutes is a generous ceiling).
export const scoreSchema = z
  .number()
  .finite("Score must be a finite number")
  .int("Score must be an integer number of milliseconds")
  .min(0, "Score cannot be negative")
  .max(600_000, "Score is out of the allowed range");

export const leaderboardLimitSchema = z.number().int().min(1).max(100);
