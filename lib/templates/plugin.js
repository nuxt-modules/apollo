import Vue from 'vue'
import VueApollo from 'vue-apollo'
import 'isomorphic-fetch'
import { createApolloClient, restartWebsockets } from 'vue-cli-plugin-apollo/graphql-client'
import jsCookie from 'js-cookie'
import cookie from 'cookie'
import { InMemoryCache } from 'apollo-cache-inmemory'

Vue.use(VueApollo)

export default (ctx, inject) => {
  const providerOptions = { clients: {} }
  const { app, beforeNuxtRender, req } = ctx
  const AUTH_TOKEN_NAME = '<%= options.tokenName %>'
  const COOKIE_ATTRIBUTES = <%= serialize(options.cookieAttributes) %>
  const AUTH_TYPE = '<%= options.authenticationType %> '

  // Config
  <% Object.keys(options.clientConfigs).forEach((key) => { %>
      const <%= key %>TokenName = '<%= options.clientConfigs[key].tokenName %>'  || AUTH_TOKEN_NAME
      const <%= key %>CookieAttributes = '<%= options.clientConfigs[key].cookieAttributes %>'  || COOKIE_ATTRIBUTES

      function <%= key %>GetAuth () {
        let token
        if(process.server){
          const cookies = cookie.parse((req && req.headers.cookie) || '')
          token = cookies[<%= key %>TokenName]
        } else {
          token = jsCookie.get(<%= key %>TokenName, <%= key %>CookieAttributes)
        }
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
        <%= key %>Cache.restore(window.__NUXT__ ? window.__NUXT__.apollo.<%= key === 'default' ? 'defaultClient' : key %> : null)
      }

      if (!<%= key %>ClientConfig.getAuth) {
        <%= key %>ClientConfig.getAuth = <%= key %>GetAuth
      }
      <%= key %>ClientConfig.ssr = !!process.server
      <%= key %>ClientConfig.cache = <%= key %>Cache
      <%= key %>ClientConfig.tokenName = <%= key %>TokenName
      <%= key %>ClientConfig.cookieAttributes = <%= key %>CookieAttributes

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
      errorHandler (error) {
        <% if (options.errorHandler) { %>
          require('<%= options.errorHandler %>').default(error, ctx)
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
    onLogin: async (token, apolloClient = apolloProvider.defaultClient, cookieAttributes = COOKIE_ATTRIBUTES) => {
      // Fallback for tokenExpires param
      if (typeof cookieAttributes === 'number') cookieAttributes = { expires: cookieAttributes }

      if (token) {
        jsCookie.set(AUTH_TOKEN_NAME, token, cookieAttributes)
      } else {
        jsCookie.remove(AUTH_TOKEN_NAME, cookieAttributes)
      }
      if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
      try {
        await apolloClient.resetStore()
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('%cError on cache reset (setToken)', 'color: orange;', e.message)
      }
    },
    onLogout: async (apolloClient = apolloProvider.defaultClient) => {
        jsCookie.remove(AUTH_TOKEN_NAME, COOKIE_ATTRIBUTES)
        if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
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
        return jsCookie.get(tokenName, COOKIE_ATTRIBUTES)
    }
  })
}
