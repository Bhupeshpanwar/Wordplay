# Letter-typing game — backend

Bun + TypeScript + GraphQL Yoga + Prisma + PostgreSQL, in Docker Compose.

## What's implemented

- **Register / login** — `Bun.password` (argon2id) for hashing, JWTs (`jsonwebtoken`) for sessions.
- **Auth on mutations that need it** — `submitScore`, `myScores`, and `me` require a valid
  `Authorization: Bearer <token>` header. The user id is always read from the verified token,
  never trusted from client input, so nobody can submit scores as someone else.
- **Input validation** — `zod` schemas for username, password, and score value; bad input
  returns a `BAD_USER_INPUT` GraphQL error instead of hitting the database.
- **Meaningful GraphQL errors** — every thrown error has an `extensions.code`
  (`BAD_USER_INPUT`, `UNAUTHENTICATED`, `CONFLICT`) so the frontend can branch on it instead of
  parsing message strings.
- **Game-result persistence** — `submitScore(value: Int!)`. `value` is the completion time in
  **milliseconds** (your game already computes this as `finalTime` in seconds — just send
  `Math.round(finalTime * 1000)`). Lower is better, matching your game's rules.
- **Leaderboard** — `leaderboard(limit: Int = 10)` returns each player's *personal best* time,
  fastest first (one row per player, not one row per run).
- **Prisma migrations** — a working initial migration is included at
  `prisma/migrations/20260826120000_init`, so `prisma migrate deploy` works immediately.
- **Tests** — `tests/auth.test.ts` and `tests/score.test.ts` run real GraphQL operations against
  a real Postgres database via Prisma (no mocking) — these are the integration tests. They
  truncate the `User`/`Score` tables before each test.

## Project layout

```
backend/
  docker-compose.yml        # postgres + app services
  Dockerfile
  prisma/schema.prisma
  prisma/migrations/        # initial migration included
  src/
    db.ts                   # Prisma client singleton
    auth/password.ts        # Bun.password hash/verify
    auth/jwt.ts              # sign/verify JWT
    validation/schemas.ts    # zod input validation
    errors.ts                 # GraphQLError helpers with error codes
    graphql/typeDefs.ts
    graphql/resolvers.ts
    graphql/context.ts        # pulls the user off the Authorization header
    graphql/schema.ts
    index.ts                  # Bun.serve + GraphQL Yoga, mounted at /graphql
  tests/
    helpers/executeOperation.ts
    auth.test.ts
    score.test.ts
```

## What you need to do

1. **Install Bun** if you don't have it: https://bun.sh

2. **Copy the env file and set a real secret:**
   ```bash
   cd backend
   cp .env.example .env
   # edit .env and set JWT_SECRET to a long random string
   ```

3. **Start Postgres** (Docker Compose):
   ```bash
   docker compose up -d postgres
   ```

4. **Install dependencies and generate the Prisma client:**
   ```bash
   bun install
   bunx prisma generate
   ```

5. **Apply the migration:**
   ```bash
   bunx prisma migrate deploy
   ```
   (If you later change `schema.prisma`, use `bunx prisma migrate dev --name <change>` instead,
   which generates a fresh migration file.)

6. **Run the server:**
   ```bash
   bun run dev
   ```
   GraphQL is now live at `http://localhost:3000/graphql` (Yoga also serves an in-browser
   GraphiQL there for manual testing).

   Alternatively, run everything (Postgres **and** the app) in Docker:
   ```bash
   docker compose up --build
   ```

7. **Run the tests** (needs Postgres reachable via `DATABASE_URL` — they will wipe the `User`
   and `Score` tables each run, so don't point this at real data):
   ```bash
   bun test
   ```

## Wiring up your frontend

Your two components are fine as-is structurally, but they currently talk to the old REST
endpoints (`/login`, `/register`) — those need to become GraphQL calls to `/graphql`, and the
game needs to actually submit its score and (optionally) show the leaderboard. See the chat
message for copy-pasteable snippets for both.

Key points either way:
- `register`/`login` return `{ token, user: { id, username } }` — store the `token` (used for
  auth) in `localStorage`, e.g. under `authToken`, and `user.id`/`user.username` if you want them
  for display.
- Every authenticated request (`submitScore`, `myScores`, `me`) needs
  `Authorization: Bearer <token>` in the headers.
- `submitScore` takes the time in **milliseconds**, not seconds.
