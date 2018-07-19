import Vue from 'vue'
import VueApollo from 'vue-apollo'
import 'isomorphic-fetch'
import { w3cwebsocket as W3CWebSocket } from 'websocket'
import * as AbsintheSocket from "@absinthe/socket";
import { createAbsintheSocketLink } from "@absinthe/socket-apollo-link";
import { Socket as PhoenixSocket } from "phoenix";
import jsCookie from 'js-cookie'
import cookie from 'cookie'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { ApolloClient } from "apollo-client";
import { ApolloLink, from } from "apollo-link";
import { withClientState } from "apollo-link-state";

Vue.use(VueApollo)

class SocketLink extends ApolloLink {
  constructor(wsEndpoint, options) {
    super()
    this.endpoint = wsEndpoint;
    this.getAuthToken = options.getAuthToken;
    this.socket = this.createPhoenixSocket(this.getAuthToken());
    this.link = this.createInnerSocketLink(this.socket);
  }

  createPhoenixSocket(authToken) {
    return new PhoenixSocket(this.endpoint, {
      transport: process.server ? W3CWebSocket : null,
      params: authToken ? {
        token: authToken,
      } : {},
    })
  }
  
  createInnerSocketLink(phoenixSocket) {
    const absintheSocket = AbsintheSocket.create(phoenixSocket)
    return createAbsintheSocketLink(absintheSocket)
  }

  request(operation, forward) {
    return this.link.request(operation, forward)
  }

  restart() {
    const newToken = this.getAuthToken()
    this.socket.disconnect()
    this.socket = this.createPhoenixSocket(newToken)
    this.link = this.createInnerSocketLink(this.socket)
  }
}

const createApolloClient = ({
  wsEndpoint = null,
  tokenName = "apollo-token",
  ssr = false,
  link = null,
  cache = null,
  apollo = {},
  clientState = null,
  getAuth = defaultGetAuth,
}) => {
  let stateLink; let socketLink;

  // Apollo cache
  if (!cache) {
    cache = new InMemoryCache();
  }

  if (!ssr) {
    // If on the client, recover the injected state
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-underscore-dangle
      const state = window.__NUXT__.apollo
      if (state) {
        // If you have multiple clients, use `state.<client_id>`
        cache.restore(state.defaultClient)
      }
    }
  } 

  if (wsEndpoint) {
    // Create the subscription websocket link
    socketLink = new SocketLink(wsEndpoint, {
      getAuthToken: getAuth
    })
    link = socketLink;
  }

  if (clientState) {
    stateLink = withClientState({
      cache,
      ...clientState,
    });
    link = from([stateLink, link]);
  }

  const apolloClient = new ApolloClient({
    link,
    cache,
    // Additional options
    ...(ssr
      ? {
          // Set this on the server to optimize queries when SSR
          ssrMode: true,
        }
      : {
          // This will temporary disable query force-fetching
          ssrForceFetchDelay: 100,
          // Apollo devtools
          connectToDevTools: process.env.NODE_ENV !== "production",
        }),
    ...apollo,
  });

  // Re-write the client state defaults on cache reset
  if (stateLink) {
    apolloClient.onResetStore(stateLink.writeDefaults);
  }

  return {
    apolloClient,
    socketLink,
    stateLink,
  };
};

export default (ctx, inject) => {
  const providerOptions = { clients: {} }
  const { app, beforeNuxtRender, req } = ctx
  const AUTH_TOKEN_NAME = '<%= options.tokenName %>'
  const AUTH_TYPE = '<%= options.authenticationType %> '

  // Config
  <% Object.keys(options.clientConfigs).forEach((key) => { %>
      const <%= key %>TokenName = '<%= options.clientConfigs[key].tokenName %>'  || AUTH_TOKEN_NAME

      function defaultGetAuth () {
        let token
        if(process.server){
          const cookies = cookie.parse((req && req.headers.cookie) || '')
          token = cookies[<%= key %>TokenName]
        } else {
          token = jsCookie.get(<%= key %>TokenName)
        }
        return token ? token : ''
      }

      let <%= key %>ClientConfig;
      <% if (typeof options.clientConfigs[key] === 'object') { %>
        <%= key %>ClientConfig = <%= JSON.stringify(options.clientConfigs[key], null, 2) %>
      <% } else if (typeof options.clientConfigs[key] === 'string') { %>
        <%= key %>ClientConfig = require('<%= options.clientConfigs[key] %>')

        if ('default' in <%= key %>ClientConfig) {
          <%= key %>ClientConfig = <%= key %>ClientConfig.default
        }

        <%= key %>ClientConfig = <%= key %>ClientConfig(ctx)
      <% } %>

      const <%= key %>Cache = <%= key %>ClientConfig.cache
        ? <%= key %>ClientConfig.cache
        : new InMemoryCache()

      if (!process.server) {
        <%= key %>Cache.restore(window.__NUXT__ ? window.__NUXT__.apollo.<%= key === 'default' ? 'defaultClient' : key %> : null)
      }

      if (!<%= key %>ClientConfig.getAuth) {
        <%= key %>ClientConfig.getAuth = defaultGetAuth
      }
      <%= key %>ClientConfig.ssr = !!process.server
      <%= key %>ClientConfig.cache = <%= key %>Cache
      <%= key %>ClientConfig.tokenName = <%= key %>TokenName

      // Create apollo client
      let <%= key %>ApolloCreation = createApolloClient({
        ...<%= key %>ClientConfig
      })
      <%= key %>ApolloCreation.apolloClient.socketLink = <%= key %>ApolloCreation.socketLink

      <% if (key === 'default') { %>
          providerOptions.<%= key %>Client = <%= key %>ApolloCreation.apolloClient
      <% } else { %>
          providerOptions.clients.<%= key %> = <%= key %>ApolloCreation.apolloClient
      <% } %>
  <% }) %>

  const vueApolloOptions = Object.assign(providerOptions, {
      errorHandler (error) {
         console.log('%cError', 'background: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', error.message)
      }
  })

  const apolloProvider = new VueApollo(vueApolloOptions)
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
    onLogin: async (token, apolloClient = apolloProvider.defaultClient) => {
      if (token) {
        jsCookie.set(AUTH_TOKEN_NAME, token)
      } else {
        jsCookie.remove(AUTH_TOKEN_NAME)
      }
      if (apolloClient.socketLink) apolloClient.socketLink.restart();
      try {
        await apolloClient.resetStore()
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('%cError on cache reset (setToken)', 'color: orange;', e.message)
      }
    },
    onLogout: async (apolloClient = apolloProvider.defaultClient) => {
        jsCookie.remove(AUTH_TOKEN_NAME)
        if (apolloClient.socketLink) apolloClient.socketLink.restart();
        try {
            await apolloClient.resetStore()
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log('%cError on cache reset (logout)', 'color: orange;', e.message)
        }
    },
    getToken: (tokenName = AUTH_TOKEN_NAME) => {
        if(process.server){
            const cookies = cookie.parse((req && req.headers.cookie) || '')
            return cookies && cookies[tokenName]
        }
        return jsCookie.get(tokenName)
    }
  })
}
