import { verifyToken, type TokenPayload } from "../auth/jwt";
import { prisma } from "../db";

export interface GraphQLContext {
  prisma: typeof prisma;
  currentUser: TokenPayload | null;
}

export async function createContext({ request }: { request: Request }): Promise<GraphQLContext> {
  const authHeader = request.headers.get("authorization");
  let currentUser: TokenPayload | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    currentUser = verifyToken(authHeader.slice("Bearer ".length).trim());
  }

  return { prisma, currentUser };
}
