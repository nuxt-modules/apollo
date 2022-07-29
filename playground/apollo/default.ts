// @ts-ignore
import { defineApolloClient } from '@nuxtjs/apollo/define'

export default defineApolloClient({
  httpEndpoint: 'https://api.spacex.land/graphql',

  // override HTTP endpoint in browser only
  // browserHttpEndpoint: '/graphql',

  // See https://www.apollographql.com/docs/link/links/http.html#options
  httpLinkOptions: {
    credentials: 'same-origin'
  },

  // You can use `wss` for secure connection (recommended in production)
  // Use `null` to disable subscriptions
  // wsEndpoint: 'ws://localhost:4000',

  // LocalStorage token
  tokenName: 'apollo-token',

  // Enable Automatic Query persisting with Apollo Engine
  persisting: false,

  // Use websockets for everything (no HTTP)
  // You need to pass a `wsEndpoint` for this to work
  websocketsOnly: false,

  getAuth: () => 'Bearer my_secret'

})
