import Vue from 'vue'
import VueApollo from 'vue-apollo'
import 'cross-fetch/polyfill'
import { createApolloClient, restartWebsockets } from 'vue-cli-plugin-apollo/graphql-client/src'
import Cookie from 'universal-cookie'
import { InMemoryCache } from 'apollo-cache-inmemory'

Vue.use(VueApollo)

export default (ctx, inject) => {
  const providerOptions = { clients: {} }
  const { app, beforeNuxtRender, req } = ctx
  const AUTH_TOKEN_NAME = '<%= options.tokenName %>'
  const COOKIE_ATTRIBUTES = <%= serialize(options.cookieAttributes) %>
  const AUTH_TYPE = '<%= options.authenticationType %> '
  const cookies = new Cookie(req && req.headers.cookie)

  // Config
  <% Object.keys(options.clientConfigs).forEach((key) => { %>
      const <%= key %>TokenName = '<%= options.clientConfigs[key].tokenName %>'  || AUTH_TOKEN_NAME

      function <%= key %>GetAuth () {
        const token = cookies.get(<%= key %>TokenName)
        return token && <%= key %>ClientConfig.validateToken(token) ? AUTH_TYPE + token : ''
      }

      let <%= key %>ClientConfig
      <% if (typeof options.clientConfigs[key] === 'object') { %>
        <%= key %>ClientConfig = <%= JSON.stringify(options.clientConfigs[key], null, 2) %>
      <% } else if (typeof options.clientConfigs[key] === 'string') { %>
        <%= key %>ClientConfig = require('<%= options.clientConfigs[key] %>')

        if ('default' in <%= key %>ClientConfig) {
          <%= key %>ClientConfig = <%= key %>ClientConfig.default
        }

        <%= key %>ClientConfig = <%= key %>ClientConfig(ctx)
      <% } %>


      const <%= key %>ValidateToken = () => true

      if (!<%= key %>ClientConfig.validateToken) {
        <%= key %>ClientConfig.validateToken = <%= key %>ValidateToken
      }

      const <%= key %>Cache = <%= key %>ClientConfig.cache
        ? <%= key %>ClientConfig.cache
        : new InMemoryCache(<%= key %>ClientConfig.inMemoryCacheOptions ? <%= key %>ClientConfig.inMemoryCacheOptions: undefined)

      if (!process.server) {
        <%= key %>Cache.restore(window.__NUXT__ && window.__NUXT__.apollo ? window.__NUXT__.apollo.<%= key === 'default' ? 'defaultClient' : key %> : null)
      }

      if (!<%= key %>ClientConfig.getAuth) {
        <%= key %>ClientConfig.getAuth = <%= key %>GetAuth
      }

      if (process.client && <%= key %>ClientConfig.browserHttpEndpoint) {
        <%= key %>ClientConfig.httpEndpoint = <%= key %>ClientConfig.browserHttpEndpoint
      }

      <% if (options.defaultOptions) { %>
        <%= key %>ClientConfig.apollo = { defaultOptions: <%= JSON.stringify(options.defaultOptions) %> }
      <% } %>

      <%= key %>ClientConfig.ssr = !!process.server
      <%= key %>ClientConfig.cache = <%= key %>Cache
      <%= key %>ClientConfig.tokenName = <%= key %>TokenName

      // if ssr we'd still like to have our webclient's cookies
      if (process.server && req && req.headers && req.headers.cookie) {
        if (!<%= key %>ClientConfig.httpLinkOptions) {
          <%= key %>ClientConfig.httpLinkOptions = {}
        }
        if (!<%= key %>ClientConfig.httpLinkOptions.headers) {
          <%= key %>ClientConfig.httpLinkOptions.headers = {}
        }
        <%= key %>ClientConfig.httpLinkOptions.headers.cookie = req.headers.cookie
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

  const vueApolloOptions = Object.assign(providerOptions, {
      <% if (options.defaultOptions) { %>
        defaultOptions: <%= JSON.stringify(options.defaultOptions) %>,
      <% } %>
      <% if (options.watchLoading) { %>
        watchLoading (isLoading, countModifier) {
          return require('<%= options.watchLoading %>').default(isLoading, countModifier, ctx)
        },
      <% } %>
      errorHandler (error) {
        <% if (options.errorHandler) { %>
          return require('<%= options.errorHandler %>').default(error, ctx)
        <% } else { %>
          console.log('%cError', 'background: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', error.message)
        <% } %>
      }
  })

  const apolloProvider = new VueApollo(vueApolloOptions)
  // Allow access to the provider in the context
  app.apolloProvider = apolloProvider

  if (process.server) {
    const ApolloSSR = require('vue-apollo/ssr')
    beforeNuxtRender(({ nuxtState }) => {
      nuxtState.apollo = ApolloSSR.getStates(apolloProvider)
    })
  }

  inject('apolloHelpers', {
    onLogin: async (token, apolloClient = apolloProvider.defaultClient, cookieAttributes = COOKIE_ATTRIBUTES, skipResetStore = false) => {
      // Fallback for tokenExpires param
      if (typeof cookieAttributes === 'number') cookieAttributes = { expires: cookieAttributes }

      if (typeof cookieAttributes.expires === 'number') {
        cookieAttributes.expires = new Date(Date.now()+ 86400*1000*cookieAttributes.expires)
      }

      if (token) {
        cookies.set(AUTH_TOKEN_NAME, token, cookieAttributes)
      } else {
        cookies.remove(AUTH_TOKEN_NAME, cookieAttributes)
      }
      if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
      if (!skipResetStore) {
        try {
          await apolloClient.resetStore()
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('%cError on cache reset (setToken)', 'color: orange;', e.message)
        }
      }
    },
    onLogout: async (apolloClient = apolloProvider.defaultClient, skipResetStore = false) => {
      cookies.remove(AUTH_TOKEN_NAME, COOKIE_ATTRIBUTES)
      if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
      if (!skipResetStore) {
        try {
          await apolloClient.resetStore()
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('%cError on cache reset (logout)', 'color: orange;', e.message)
        }
      }
    },
    getToken: (tokenName = AUTH_TOKEN_NAME) => {
      return cookies.get(tokenName)
    }
  })
}
