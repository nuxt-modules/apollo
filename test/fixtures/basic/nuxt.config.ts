import NuxtApollo from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtApollo],

  apollo: {
    clients: {
      default: {
        httpEndpoint: 'http://localhost/graphql',
        httpLinkOptions: {
          fetch: async () => new Response(JSON.stringify({ data: { greeting: 'Hello from GraphQL' } }), {
            headers: { 'content-type': 'application/json' }
          })
        }
      }
    }
  }
})
