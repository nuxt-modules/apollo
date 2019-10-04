import gql from 'graphql-tag'

export default function (ctx) {
  return {
    typeDefs: gql`
    type Query {
      connected: Boolean!
    }
    `,
    resolvers: {
      Mutation: {
        connectedSet: (root, { value }, { cache }) => {
          const data = {
            connected: value
          }
          cache.writeData({ data })
        }
      }
    },
    onCacheInit: cache => {
      const data = {
        connected: false
      }
      cache.writeData({ data })
    }
  }
}
