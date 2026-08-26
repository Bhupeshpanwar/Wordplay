export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    username: String!
    createdAt: String!
  }

  """
  A single game result. "value" is the completion time in milliseconds —
  lower is better.
  """
  type Score {
    id: ID!
    value: Int!
    createdAt: String!
    user: User!
  }

  """
  One row of the leaderboard: a player's personal best time.
  """
  type LeaderboardEntry {
    user: User!
    bestValue: Int!
    achievedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    "The currently authenticated user, or null if not logged in."
    me: User

    "All of the current user's scores, fastest (best) first. Requires auth."
    myScores: [Score!]!

    "Top players ranked by personal-best time, fastest first."
    leaderboard(limit: Int = 10): [LeaderboardEntry!]!
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!

    "Submit a completed game's time (ms). Requires auth."
    submitScore(value: Int!): Score!
  }
`;
