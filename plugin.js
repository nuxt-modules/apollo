import 'isomorphic-fetch'
import Vue from 'vue'
import { ApolloClient } from 'apollo-client'
import { InMemoryCache } from 'apollo-cache-inmemory'
import VueApollo from 'vue-apollo'

Vue.use(VueApollo)

export default (ctx) => {

  const providerOptions = {
    clients: {}
  }

  const { isDev, app, route, beforeNuxtRender, store } = ctx

  <% Object.keys(options.clientConfigs).forEach((key) => { %>
    let client = require('<%= options.clientConfigs[key] %>')
    // es6 module default export or not
    client = client.default(ctx) || client(ctx)
    const cache = client.cache || new InMemoryCache()

    const opts = process.server ? {
        ssrMode: true
    } : {
      ssrForceFetchDelay: 100,
      connectToDevTools: isDev
    }

    // hydrate client cache from the server
    if (!process.server) {
      cache.restore(window.__NUXT__ ? window.__NUXT__.apollo.<%= key === 'default' ? 'defaultClient' : key %> : null)
    }

    const finalOptions = Object.assign({}, opts, client, { cache })
    const <%= key %>Client = new ApolloClient(finalOptions)

    <% if (key === 'default') { %>
      providerOptions.<%= key %>Client = <%= key %>Client
    <% } else { %>
      providerOptions.clients.<%= key %> = <%= key %>Client
    <% } %>

  <% }) %>


  app.apolloProvider = new VueApollo(providerOptions)

  if (process.server) {
    beforeNuxtRender(async ({ Components, nuxtState }) => {
      Components.forEach((Component) => {
        // Fix https://github.com/nuxt-community/apollo-module/issues/19
        if (Component.options && Component.options.apollo && Component.options.apollo.$init) {
          delete Component.options.apollo.$init
        }
      })
      await app.apolloProvider.prefetchAll(ctx, Components)
      nuxtState.apollo = app.apolloProvider.getStates()
    })
  }

}
