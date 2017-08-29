import Vue from 'vue'
import 'isomorphic-fetch'
import VueApollo from 'vue-apollo'
import { ApolloClient, createNetworkInterface } from 'apollo-client'

Vue.use(VueApollo)

export default (ctx) => {

  const providerOptions = {
    clients: {}
  }

  const { isClient, isServer, app, route, beforeNuxtRender, store } = ctx

  <% Object.keys(options.networkInterfaces).forEach((key) => { %>
    let networkInterface = require('<%= options.networkInterfaces[key] %>')
    networkInterface = networkInterface.default(ctx) || networkInterface(ctx)
    const <%= key %>Client = new ApolloClient({
      networkInterface,
      ...(isServer ? {
        ssrMode: true
      } : {
        initialState: window.__NUXT__.apollo.<%= key === 'default' ? 'defaultClient' : key %>,
        ssrForceFetchDelay: 100
      })
    })
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
