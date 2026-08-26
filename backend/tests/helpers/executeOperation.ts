import { execute, parse } from "graphql";
import { schema } from "../../src/graphql/schema";
import { prisma } from "../../src/db";
import type { TokenPayload } from "../../src/auth/jwt";
import type { GraphQLContext } from "../../src/graphql/context";

/**
 * Runs a GraphQL operation straight through the real schema/resolvers,
 * which hit the real Postgres database via Prisma. This is the integration
 * layer: no HTTP involved, but no mocks either — auth is simulated by
 * passing the context directly instead of a signed JWT header.
 */
export async function executeOperation(
  source: string,
  variableValues: Record<string, unknown> = {},
  currentUser: TokenPayload | null = null
) {
  const contextValue: GraphQLContext = { prisma, currentUser };

  return execute({
    schema,
    document: parse(source),
    variableValues,
    contextValue,
  });
}

export async function resetDatabase() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Score", "User" RESTART IDENTITY CASCADE');
}
