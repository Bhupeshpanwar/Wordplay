import { createYoga } from "graphql-yoga";
import { schema } from "./graphql/schema";
import { createContext } from "./graphql/context";

const yoga = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/graphql",
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

const port = Number(process.env.PORT) || 3000;

const server = Bun.serve({
  port,
  fetch: yoga.fetch,
});

console.log(`GraphQL server running at http://localhost:${port}/graphql`);
