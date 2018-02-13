import 'isomorphic-fetch'
import Vue from 'vue'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import VueApollo from 'vue-apollo'

Vue.use(VueApollo)

export default (ctx) => {
  const providerOptions = { clients: {} }
  const { isDev, app, route, beforeNuxtRender, store } = ctx

  <% Object.keys(options.clientConfigs).forEach((key) => { %>
    // *** <%= key %> Apollo client ***
    <% let clientConfig = `${key}ClientConfig` %>
    let <%= clientConfig %> = require('<%= options.clientConfigs[key] %>')
    // es6 module default export or not
    <%= clientConfig %> = <%= clientConfig %>.default(ctx) || <%= clientConfig %>(ctx)

    <% let cache = `${key}Cache` %>
    const <%= cache %> = <%= clientConfig %>.cache || new InMemoryCache()

    <% let opts = `${key}Opts` %>
    const <%= opts %> = process.server ? {
      ssrMode: true
    } : {
      ssrForceFetchDelay: 100,
      connectToDevTools: isDev
    }

    // hydrate client cache from the server
    if (!process.server) {
      <%= cache %>.restore(window.__NUXT__ ? window.__NUXT__.apollo.<%= key === 'default' ? 'defaultClient' : key %> : null)
    }

    <% let finalOptions = `${key}FinalOpts` %>
    const <%= finalOptions %> = Object.assign({}, <%= opts %>, <%= clientConfig %>, { <%= cache %> })
    const <%= key %>Client = new ApolloClient(<%= finalOptions %>)

    <% if (key === 'default') { %>
      providerOptions.<%= key %>Client = <%= key %>Client
    <% } else { %>
      providerOptions.clients.<%= key %> = <%= key %>Client
    <% } %>
  <% }) %>

  const apolloProvider = new VueApollo(providerOptions)
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
}
