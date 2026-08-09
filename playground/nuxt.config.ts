import GraphQLPlugin from '@rollup/plugin-graphql'

export default defineNuxtConfig({

  modules: ['@nuxt/ui', '@nuxtjs/apollo'],
  devtools: { enabled: true },

  colorMode: {
    preference: 'dark',
    storageKey: 'na-color-scheme'
  },

  vite: {
    plugins: [Promise.resolve([GraphQLPlugin()])]
  },

  apollo: {
    clients: {
      default: './apollo/default.ts',
      github: {
        httpEndpoint: 'https://api.github.com/graphql',
        tokenStorage: 'cookie'
      },
      todos: {
        httpEndpoint: 'https://nuxt-gql-server-2gl6xp7kua-ue.a.run.app/query',
        wsEndpoint: 'wss://nuxt-gql-server-2gl6xp7kua-ue.a.run.app/query',
        defaultOptions: {
          watchQuery: {
            fetchPolicy: 'cache-and-network'
          }
        },
        httpLinkOptions: {
          headers: {
            'X-CUSTOM-HEADER': '123'
          }
        }
      }
    }
  }
})
