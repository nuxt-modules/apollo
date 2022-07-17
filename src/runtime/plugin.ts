import { createClient } from 'graphql-ws'
import { onError } from '@apollo/client/link/error'
import { getMainDefinition } from '@apollo/client/utilities'
import { provideApolloClients } from '@vue/apollo-composable'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { ApolloClient, ApolloLink, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import type { ModuleOptions } from './types'
import { defineNuxtPlugin } from '#imports'

// @ts-ignore
import ApolloErrorHandler from '#apollo/error-handler'

export default defineNuxtPlugin(() => {
  const opts = useRuntimeConfig()?.public?.apollo as ModuleOptions<true>

  const requestCookies = process.server && useRequestHeaders(['cookie'])

  const clients: { [key: string]: ApolloClient<any> } = {}

  for (const [key, clientConfig] of Object.entries(opts.clientConfigs)) {
    const httpLink = createHttpLink({
      ...(clientConfig?.httpLinkOptions && clientConfig.httpLinkOptions),
      uri: (process.client && clientConfig.browserHttpEndpoint) || clientConfig.httpEndpoint,
      headers: {
        ...(requestCookies && requestCookies),
        ...(clientConfig?.getAuth && { authorization: clientConfig.getAuth })
      }
    })

    const wsLink = process.client && clientConfig.wsEndpoint && new GraphQLWsLink(
      createClient({
        url: clientConfig.wsEndpoint,
        connectionParams: () => clientConfig?.getAuth && { authorization: clientConfig.getAuth }
      })
    )

    const errorLink = onError((err) => {
      if (process.env.NODE_ENV === 'production') { return }

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

    const cache = new InMemoryCache()

    clients[key] = new ApolloClient({
      link,
      cache,
      ...(process.server
        ? { ssrMode: true }
        : { ssrForceFetchDelay: 100 }),
      connectToDevTools: clientConfig.connectToDevTools
    })
  }

  provideApolloClients(clients)

  const defaultClient = clients?.default || clients[Object.keys(clients)[0]]

  const apolloHelpers = {
    getToken: (tokenName?: string) => useCookie(tokenName || opts?.tokenName, opts.cookieAttributes).value,
    onLogin: async (token?: string, client?: string, cookieAttributes = opts.cookieAttributes, skipResetStore = false) => {
      const tokenName = (client && opts.clientConfigs?.[client]?.tokenName) || opts?.tokenName

      const cookie = useCookie(tokenName, cookieAttributes)

      cookie.value = token || undefined

      // if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)

      if (skipResetStore) { return }

      await clients?.[client || 'default'].resetStore().catch(e => console.log('%cError on cache reset (onLogin)', 'color: orange;', e.message))
    },
    onLogout: async (client?: string, skipResetStore?: boolean) => {
      const tokenName = (client && opts.clientConfigs?.[client]?.tokenName) || opts?.tokenName

      const cookie = useCookie(tokenName, opts?.cookieAttributes)

      if (!cookie.value) { return }

      cookie.value = undefined

      if (skipResetStore) { return }

      await clients?.[client || 'default'].resetStore().catch(e => console.log('%cError on cache reset (onLogout)', 'color: orange;', e.message))
    }
  }

  return { provide: { apollo: { clients, defaultClient }, apolloHelpers } }
})
