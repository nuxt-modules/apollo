import 'isomorphic-fetch'
import Vue from 'vue'
import VueApollo from 'vue-apollo'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { createApolloClient, restartWebsockets } from 'vue-cli-plugin-apollo/graphql-client'
import Cookie from 'js-cookie'

Vue.use(VueApollo)

const AUTH_TOKEN = 'apollo-token'

export default (ctx, inject) => {
  const providerOptions = { clients: {} }
  const { isDev, app, route, beforeNuxtRender, store } = ctx

  const cache = new InMemoryCache()

  if (!process.server) {
    cache.restore(window.__NUXT__ ? window.__NUXT__.apollo.defaultClient : null)
  }

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
    cache: cache,

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
    const token = Cookie.get(tokenName)
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

  // Set token function
  async function setToken (token, apolloClient = apolloProvider.defaultClient) {
    if (token) {
      Cookie.set(AUTH_TOKEN, token)
    } else {
      Cookie.remove(AUTH_TOKEN)
    }
    if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
    try {
      await apolloClient.resetStore()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('%cError on cache reset (login)', 'color: orange;', e.message)
    }
  }

  // inject('apolloHelpers',)
}
