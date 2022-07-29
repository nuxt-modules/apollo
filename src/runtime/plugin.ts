import destr from 'destr'
import { onError } from '@apollo/client/link/error'
import { getMainDefinition } from '@apollo/client/utilities'
import { ApolloClients, provideApolloClients } from '@vue/apollo-composable'
import { ApolloClient, ApolloLink, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { setContext } from '@apollo/client/link/context'
import createRestartableClient from '../runtime/utils/ws'
import type { NuxtApolloConfig } from '../types'
import { useApollo } from './composables'
import { defineNuxtPlugin, useRuntimeConfig, useRequestHeaders } from '#imports'

// @ts-ignore
import ApolloErrorHandler from '#apollo/error-handler'

export default defineNuxtPlugin((nuxtApp) => {
  const opts = useRuntimeConfig()?.public?.apollo as NuxtApolloConfig

  const requestCookies = process.server && useRequestHeaders(['cookie'])

  const clients: { [key: string]: ApolloClient<any> } = {}

  for (const [key, clientConfig] of Object.entries(opts.clientConfigs)) {
    const getAuth = () => {
      const authCookie = ref<string>()

      if (process.client) {
        authCookie.value = useCookie(clientConfig.tokenName).value
      } else if (requestCookies?.cookie) {
        authCookie.value = requestCookies.cookie.split(';').find(c => c.trim().startsWith(`${clientConfig.tokenName}=`))?.split('=')?.[1]
      }

      if (!authCookie.value) { return }

      if (clientConfig?.authType === null) { return authCookie.value }

      return `${clientConfig?.authType || opts.authType} ${authCookie.value}`
    }

    const authLink = setContext((_, { headers }) => {
      const auth = getAuth()

      if (!auth) { return }

      return {
        headers: {
          ...headers,
          ...(requestCookies && requestCookies),
          [clientConfig.authHeader]: auth
        }
      }
    })

    const httpLink = authLink.concat(createHttpLink({
      ...(clientConfig?.httpLinkOptions && clientConfig.httpLinkOptions),
      uri: (process.client && clientConfig.browserHttpEndpoint) || clientConfig.httpEndpoint,
      headers: { ...(clientConfig?.httpLinkOptions?.headers || {}) }
    }))

    let wsLink: GraphQLWsLink = null

    if (process.client && clientConfig.wsEndpoint) {
      const wsClient = createRestartableClient({
        ...clientConfig.wsLinkOptions,
        url: clientConfig.wsEndpoint,
        connectionParams: () => {
          const auth = getAuth()

          if (!auth) { return }

          return { [clientConfig.authHeader]: auth }
        }
      })

      wsLink = new GraphQLWsLink(wsClient)

      nuxtApp._apolloWsClients = nuxtApp._apolloWsClients || {}
      nuxtApp._apolloWsClients[key] = wsClient
    }

    const errorLink = onError((err) => {
      if (process.env.NODE_ENV === 'production') { return }

      // console.log('X', ApolloErrorHandler(err))

      return ApolloErrorHandler(err)
    })

    const link = ApolloLink.from([
      errorLink,
      ...(!wsLink
        ? [httpLink]
        : [split(
            ({ query }) => {
              const definition = getMainDefinition(query)
              return (definition.kind === 'OperationDefinition' && definition.operation === 'subscription')
            },
            wsLink,
            httpLink
          )])
    ])

    const cache = new InMemoryCache(clientConfig.inMemoryCacheOptions)

    clients[key] = new ApolloClient({
      link,
      cache,
      ...(process.server
        ? { ssrMode: true }
        : { ssrForceFetchDelay: 100 }),
      connectToDevTools: clientConfig.connectToDevTools,
      defaultOptions: clientConfig?.defaultOptions || opts.defaultOptions
    })

    const cacheKey = `_apollo:${key}`

    nuxtApp.hook('app:rendered', () => {
      nuxtApp.payload.data[cacheKey] = cache.extract()
    })

    if (process.client && nuxtApp.payload.data[cacheKey]) {
      cache.restore(destr(JSON.stringify(nuxtApp.payload.data[cacheKey])))
    }
  }

  provideApolloClients(clients)
  nuxtApp.vueApp.provide(ApolloClients, clients)
  nuxtApp._apolloClients = clients

  const defaultClient = clients?.default || clients[Object.keys(clients)[0]]

  return {
    provide: {
      apolloHelpers: useApollo(),
      apollo: { clients, defaultClient }
    }
  }
})
