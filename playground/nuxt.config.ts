import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/apollo'],

  apollo: {
    clientConfigs: {
      default: './apollo/default.ts',
      github: {
        httpEndpoint: 'https://api.github.com/graphql'
      },
      todos: {
        httpEndpoint: 'https://nuxt-gql-server-2gl6xp7kua-ue.a.run.app/query',
        wsEndpoint: 'wss://nuxt-gql-server-2gl6xp7kua-ue.a.run.app/query',
        httpLinkOptions: {
          headers: {
            'X-CUSTOM-HEADER': 123
          }
        }
      }
    },
    errorHandler: './apollo/error.ts'
  }
})
