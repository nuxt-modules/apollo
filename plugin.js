import 'isomorphic-fetch'
import Vue from 'vue'
import VueApollo from 'vue-apollo'
import { ApolloClient } from 'apollo-client'
import { split, from } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { createUploadLink } from 'apollo-upload-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { SubscriptionClient } from 'subscriptions-transport-ws'
import MessageTypes from 'subscriptions-transport-ws/dist/message-types'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'
import { createPersistedQueryLink } from 'apollo-link-persisted-queries'
import { setContext } from 'apollo-link-context'
import { withClientState } from 'apollo-link-state'
import Cookie from 'js-cookie'

Vue.use(VueApollo)

function createApolloClient ({
  httpEndpoint,
  wsEndpoint = null,
  uploadEndpoint = null,
  tokenName = 'apollo-token',
  persisting = false,
  ssr = false,
  websocketsOnly = false,
  link = null,
  cache = null,
  apollo = {},
  clientState = null,
  getAuth = defaultGetAuth,
}) {
  let wsClient, authLink, stateLink
  const disableHttp = websocketsOnly && !ssr && wsEndpoint

  // Apollo cache
  if (!cache) {
    cache = new InMemoryCache()
  }

  if (!disableHttp) {
    if (!link) {
      link = new HttpLink({
        // You should use an absolute URL here
        uri: httpEndpoint,
      })
    }

    // HTTP Auth header injection
    authLink = setContext((_, { headers }) => ({
      headers: {
        ...headers,
        authorization: getAuth(tokenName),
      },
    }))

    // Concat all the http link parts
    link = authLink.concat(link)
  }

  // On the server, we don't want WebSockets and Upload links
  if (!ssr) {
    if (!disableHttp) {
      if (persisting) {
        link = createPersistedQueryLink().concat(link)
      }

      // File upload
      const uploadLink = authLink.concat(createUploadLink({
        uri: uploadEndpoint || httpEndpoint,
      }))

      // using the ability to split links, you can send data to each link
      // depending on what kind of operation is being sent
      link = split(
        operation => operation.getContext().upload,
        uploadLink,
        link
      )
    }

    // Web socket
    if (wsEndpoint) {
      wsClient = new SubscriptionClient(wsEndpoint, {
        reconnect: true,
        connectionParams: () => ({
          authorization: getAuth(tokenName),
        }),
      })

      // Create the subscription websocket link
      const wsLink = new WebSocketLink(wsClient)

      if (disableHttp) {
        link = wsLink
      } else {
        link = split(
          // split based on operation type
          ({ query }) => {
            const { kind, operation } = getMainDefinition(query)
            return kind === 'OperationDefinition' &&
              operation === 'subscription'
          },
          wsLink,
          link
        )
      }
    }
  }

  if (clientState) {
    stateLink = withClientState({
      cache,
      ...clientState,
    })
    link = from([stateLink, link])
  }

  const apolloClient = new ApolloClient({
    link,
    cache,
    // Additional options
    ...(ssr ? {
      // Set this on the server to optimize queries when SSR
      ssrMode: true,
    } : {
      // This will temporary disable query force-fetching
      ssrForceFetchDelay: 100,
      // Apollo devtools
      connectToDevTools: process.env.NODE_ENV !== 'production',
    }),
    ...apollo,
  })

  // Re-write the client state defaults on cache reset
  if (stateLink) {
    apolloClient.onResetStore(stateLink.writeDefaults)
  }

  return {
    apolloClient,
    wsClient,
    stateLink,
  }
}

function restartWebsockets (wsClient) {
  // Copy current operations
  const operations = Object.assign({}, wsClient.operations)

  // Close connection
  wsClient.close(true)

  // Open a new one
  wsClient.connect()

  // Push all current operations to the new connection
  Object.keys(operations).forEach(id => {
    wsClient.sendMessage(
      id,
      MessageTypes.GQL_START,
      operations[id].options
    )
  })
}

function defaultGetAuth (tokenName) {
  // get the authentication token from local storage if it exists
  const token = Cookie.get(tokenName)
  // return the headers to the context so httpLink can read them
  return token ? 'Bearer ' + token : ''
}

const AUTH_TOKEN = 'apollo-token'

export default (ctx, inject) => {
  const providerOptions = { clients: {} }
  const { isDev, app, route, beforeNuxtRender, store } = ctx
  
  // Config
  <% Object.keys(options.clientConfigs).forEach((key, index) => { %>
    const <%= key %>Cache = '<%= options.clientConfigs[key].cache %>'  || new InMemoryCache()
  
    if (!process.server) {
      if (typeof window !== 'undefined') {
        <%= key %>Cache.restore(window.__NUXT__ ? window.__NUXT__.apollo.<%= key === 'default' ? 'defaultClient' : key %> : null)
      }
    }

    const <%= key %>ClientConfig = {
      // You can use `https` for secure connection (recommended in production)
      httpEndpoint: '<%= options.clientConfigs[key].httpEndpoint %>',
      // You can use `wss` for secure connection (recommended in production)
      // Use `null` to disable subscriptions
      wsEndpoint: '<%= options.clientConfigs[key].wsEndpoint %>',
      // LocalStorage token
      tokenName: '<%= options.clientConfigs[key].tokenName %>',
      // Enable Automatic Query persisting with Apollo Engine
      persisting: '<%= options.clientConfigs[key].persisting %>',
      // Use websockets for everything (no HTTP)
      // You need to pass a `wsEndpoint` for this to work
      websocketsOnly: '<%= options.clientConfigs[key].websocketsOnly %>',
      // Is being rendered on the server?
      ssr: process.server ? true : false,
  
      // Override default http link
      link: '<%= options.clientConfigs[key].link %>',
  
      // Override default cache
      cache: <%= key %>Cache,
  
      // Override the way the Authorization header is set
      getAuth: '<%= options.clientConfigs[key].getAuth %>'
  
      // Additional ApolloClient options
      // apollo: { ... },
      apollo: '<%= options.clientConfigs[key].apollo %>',
  
      // Client local data (see apollo-link-state)
      // clientState: { resolvers: { ... }, defaults: { ... } }
      clientState: '<%= options.clientConfigs[key].clientState %>'
    }

    // Create apollo client
    let <%= key %>ApolloCreation = createApolloClient({
      ...<%= key %>ClientConfig
    })
    <%= key %>ApolloCreation.apolloClient.wsClient = <%= key %>ApolloCreation.wsClient

    <% if (key === 'default') { %>
      providerOptions.<%= key %>Client = <%= key %>ApolloCreation.apolloClient
    <% } else { %>
      providerOptions.clients.<%= key %> = <%= key %>ApolloCreation.apolloClient
    <% } %>
  <% }) %>

  // Call this in the Vue app file
  function createProvider () {
    // Create vue apollo provider
    const apolloProvider = new VueApollo({
      ...providerOptions,
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

  const apolloProvider = createProvider()
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

  inject('apolloHelpers', {
    // Set token function
    setToken: async (token, apolloClient = apolloProvider.defaultClient) => {
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
        console.log('%cError on cache reset (setToken)', 'color: orange;', e.message)
      }
    }
  })
}
