import Vue from 'vue'
import VueApollo from 'vue-apollo'
import 'isomorphic-fetch'
import { createApolloClient, restartWebsockets } from 'vue-cli-plugin-apollo/graphql-client'
import jsCookie from 'js-cookie'
import cookie from 'cookie'

Vue.use(VueApollo)

export default (ctx, inject) => {
  const providerOptions = { clients: {} }
  const { app, beforeNuxtRender, req } = ctx
  const AUTH_TOKEN = '<%= options.token %>'

  // Config
  <% Object.keys(options.clientConfigs).forEach((key) => { %>
      // Create apollo client
      const currentOptions = <%= JSON.stringify(options.clientConfigs[key], null, 2) %>
      const tokenName = currentOptions.tokenName || AUTH_TOKEN
      const getAuth = typeof currentOptions.getAuth === 'function' ? currentOptions.getAuth : () => {
          let token
          if(process.server){
              const cookies = cookie.parse(req.headers.cookie || '')
              token = cookies[tokenName]
          } else {
            token = jsCookie.get(tokenName)
          }
          return token ? 'Bearer ' + token : ''
      }
      const options = Object.assign({}, currentOptions, {
        ssr: !!process.server,
        tokenName,
        getAuth
      })
      const apolloCreation = createApolloClient(options)
      apolloCreation.apolloClient.wsClient = apolloCreation.wsClient
      <% if (key === 'default') { %>
          providerOptions.<%= key %>Client = apolloCreation.apolloClient
      <% } else { %>
        providerOptions.clients.<%= key %> = apolloCreation.apolloClient
      <% } %>
  <% }) %>

  // Call this in the Vue app file
  function createProvider () {
      // Create vue apollo provider
      const options = Object.assign(providerOptions, {
          errorHandler (error) {
              console.log('%cError', 'background: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', error.message)
          },
      })
      return new VueApollo(options)
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
    onLogin: async (token, apolloClient = apolloProvider.defaultClient) => {
      if (token) {
        jsCookie.set(AUTH_TOKEN, token)
      } else {
        jsCookie.remove(AUTH_TOKEN)
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
        jsCookie.remove(AUTH_TOKEN)
        if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
        try {
            await apolloClient.resetStore()
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log('%cError on cache reset (logout)', 'color: orange;', e.message)
        }
    },
    getToken: (tokenName = AUTH_TOKEN) => {
        if(process.server){
            const cookies = cookie.parse(req.headers.cookie || '')
            return cookies && cookies[tokenName]
        }
        return jsCookie.get(tokenName)
    }
  })
}
