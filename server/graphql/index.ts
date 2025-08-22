import { createYoga } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { makeExecutableSchema } from '@graphql-tools/schema';

export const createGraphQLServer = () => {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  return createYoga({
    schema,
    graphiql: process.env.NODE_ENV === 'development',
    context: ({ request, response }) => ({
      req: request,
      res: response,
    }),
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : true,
      credentials: true,
    },
  });
};
