import 'isomorphic-fetch'
import Vue from 'vue'
import VueApollo from 'vue-apollo'
import { createApolloClient, restartWebsockets } from 'vue-cli-plugin-apollo/graphql-client'
import Cookies from 'universal-cookie'

Vue.use(VueApollo)

const cookies = new Cookies()

const AUTH_TOKEN = 'apollo-token'

export default (ctx) => {
  const providerOptions = { clients: {} }
  const { isDev, app, route, beforeNuxtRender, store } = ctx

  // Config
  const defaultOptions = {
    // You can use `https` for secure connection (recommended in production)
    httpEndpoint: 'http://localhost:4000',
    // You can use `wss` for secure connection (recommended in production)
    // Use `null` to disable subscriptions
    wsEndpoint:'ws://localhost:4000',
    // LocalStorage token
    tokenName: AUTH_TOKEN,
    // Enable Automatic Query persisting with Apollo Engine
    persisting: false,
    // Use websockets for everything (no HTTP)
    // You need to pass a `wsEndpoint` for this to work
    websocketsOnly: false,
    // Is being rendered on the server?
    ssr: process.server ? true : false,

    // Override default http link
    // link: myLink

    // Override default cache
    // cache: myCache

    // Override the way the Authorization header is set
    getAuth: defaultGetAuth

    // Additional ApolloClient options
    // apollo: { ... }

    // Client local data (see apollo-link-state)
    // clientState: { resolvers: { ... }, defaults: { ... } }
  }

  // Call this in the Vue app file
  function createProvider (options = {}) {
    // Create apollo client
    const { apolloClient, wsClient } = createApolloClient({
      ...defaultOptions,
      ...options,
    })
    apolloClient.wsClient = wsClient

    // Create vue apollo provider
    const apolloProvider = new VueApollo({
      defaultClient: apolloClient,
      defaultOptions: {
        $query: {
          // fetchPolicy: 'cache-and-network',
        },
      },
      errorHandler (error) {
        // eslint-disable-next-line no-console
        console.log('%cError', 'background: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', error.message)
      },
    })

    return apolloProvider
  }

  function defaultGetAuth (tokenName) {
    // get the authentication token from local storage if it exists
    const token = cookies.get(tokenName)
    // return the headers to the context so httpLink can read them
    return token
  }

  const apolloProvider = createProvider({})
  // Allow access to the provider in the context
  app.apolloProvider = apolloProvider
  // Install the provider into the app
  app.provide = apolloProvider.provide()

  if (process.server) {
    beforeNuxtRender(async ({ Components, nuxtState }) => {
      Components.forEach((Component) => {
        // Fix https://github.com/nuxt-community/apollo-module/issues/19
        if (Component.options && Component.options.apollo && Component.options.apollo.$init) {
          delete Component.options.apollo.$init
        }
      })
      await apolloProvider.prefetchAll(ctx, Components)
      nuxtState.apollo = apolloProvider.getStates()
    })
  }

  // Manually call this when user log in
  async function onLogin (apolloClient = apolloProvider.defaultClient, token) {
    cookies.set(AUTH_TOKEN, token)
    if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
    try {
      await apolloClient.resetStore()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('%cError on cache reset (login)', 'color: orange;', e.message)
    }
  }

  // Manually call this when user log out
  async function onLogout (apolloClient = apolloProvider.defaultClient) {
    cookies.remove(AUTH_TOKEN)
    if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
    try {
      await apolloClient.resetStore()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('%cError on cache reset (logout)', 'color: orange;', e.message)
    }
  }
}
