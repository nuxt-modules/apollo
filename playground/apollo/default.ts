// @ts-ignore
import { defineApolloClient } from '@nuxtjs/apollo/define'

export default defineApolloClient({
  // The GraphQL endpoint.
  httpEndpoint: 'https://api.spacex.land/graphql',

  // Provide a GraphQL endpoint to be used client-side. Overrides `httpEndpoint`.
  // browserHttpEndpoint: '/graphql',

  // See https://www.apollographql.com/docs/link/links/http.html#options
  httpLinkOptions: {
    credentials: 'same-origin'
  },

  // Specify a websocket endpoint to be used for subscriptions.
  // The `wss` protocol is recommended in production.
  // wsEndpoint: 'ws://localhost:4000',

  // LocalStorage token
  tokenName: 'spacex-token',

  persisting: false,

  // Specify if the client should solely use WebSocket.
  // requires `wsEndpoint`.
  websocketsOnly: false

  // getAuth: () => 'Bearer my_secret'
})
