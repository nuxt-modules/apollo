import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: ['@nuxtjs/apollo'],

  apollo: {
    clientConfigs: {
      default: './apollo/default.ts',
      github: {
        httpEndpoint: 'https://api.github.com/graphql'
        // getAuth: () => 'Bearer your_token'
      }
    }
    // errorHandler: './apollo/error.ts'
  }
})
