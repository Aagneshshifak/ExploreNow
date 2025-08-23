import { createYoga } from 'graphql-yoga';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs, resolvers } from './schema';

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export const yoga = createYoga({
  schema,
  graphqlEndpoint: '/graphql',
  landingPage: false,
});
