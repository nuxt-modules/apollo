import Vue from 'vue'
import 'isomorphic-fetch'
import VueApollo from 'vue-apollo'
import {ApolloClient} from 'apollo-client'

Vue.use(VueApollo)

export default (ctx) => {
    const {isServer, app, beforeNuxtRender, isDev, nuxtState} = ctx

    const providerOptions = {
        clients: {}
    }
    /* <% Object.keys(options.networkInterfaces).forEach((key) => { if (key === 'default') { %> */
    providerOptions[`<%= key %>Client`] = /* <% } else { %> */ providerOptions.clients[`<%= key %>`] = /* <% } %> */ new ApolloClient({
        networkInterface: require('<%= options.networkInterfaces[key] %>').default(ctx) || require('<%= options.networkInterfaces[key] %>')(ctx),
        ...(isServer ? {
            ssrMode: true
        } : {
            initialState: nuxtState.apollo[`<%= key === 'default' ? 'defaultClient' : key %>`],
            ssrForceFetchDelay: 100,
            connectToDevTools: isDev
        })
    })
    /* <% }) %> */

    app.apolloProvider = new VueApollo(providerOptions)

    if (isServer) {
        beforeNuxtRender(async ({Components, nuxtState}) => {
            Components.forEach((Component) => {
                if (Component.options && Component.options.apollo && Component.options.apollo.$init) {
                    delete Component.options.apollo.$init
                }
            })
            await app.apolloProvider.prefetchAll(ctx, Components)
            nuxtState.apollo = app.apolloProvider.getStates()
        })
    }
}
