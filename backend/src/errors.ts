import { GraphQLError } from "graphql";
import type { ZodError } from "zod";

export function badUserInput(message: string) {
  return new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });
}

export function unauthenticated(message = "You must be logged in to do this") {
  return new GraphQLError(message, { extensions: { code: "UNAUTHENTICATED" } });
}

export function conflict(message: string) {
  return new GraphQLError(message, { extensions: { code: "CONFLICT" } });
}

export function notFound(message: string) {
  return new GraphQLError(message, { extensions: { code: "NOT_FOUND" } });
}

export function formatZodError(error: ZodError): string {
  return error.errors.map((e) => e.message).join("; ");
}
