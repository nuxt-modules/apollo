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

  const { isDev, isClient, isServer, app, route, beforeNuxtRender, store } = ctx

  <% Object.keys(options.clientConfigs).forEach((key) => { %>
    let client = require('<%= options.clientConfigs[key] %>')
    // es6 module default export or not
    client = client.default(ctx) || client(ctx)

    const opts = isServer ? {
        ssrMode: true,
        cache: new InMemoryCache()
    } : {
      initialState: window.__NUXT__ ? window.__NUXT__.apollo.<%= key === 'default' ? 'defaultLink' : key %> : null,
      ssrForceFetchDelay: 100,
      cache: new InMemoryCache(),
      connectToDevTools: isDev
    }
    const finalOptions = Object.assign({}, opts, client)
    const <%= key %>Client = new ApolloClient(finalOptions)

    <% if (key === 'default') { %>
      providerOptions.<%= key %>Client = <%= key %>Client
    <% } else { %>
      providerOptions.clients.<%= key %> = <%= key %>Client
    <% } %>

  <% }) %>


  app.apolloProvider = new VueApollo(providerOptions)

  if (isServer) {
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
