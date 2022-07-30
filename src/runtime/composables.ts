import type { OperationVariables, QueryOptions } from '@apollo/client'
import type { AsyncData } from 'nuxt/dist/app/composables'
import { NuxtApolloConfig, NuxtAppApollo } from '../types'
import { useCookie, useNuxtApp, useAsyncData, useLazyAsyncData, useRuntimeConfig } from '#imports'

type TQuery<T> = QueryOptions<OperationVariables, T>['query']
type TVariables<T> = QueryOptions<OperationVariables, T>['variables']
type TAsyncQuery<T> = {
  query: TQuery<T>,
  variables?: TVariables<T>,
  key?: string,
  cache?: boolean
  clientId?: string
}

export function useAsyncQuery <T> (query: TQuery<T>, clientId?: string): AsyncData<T, Error>
export function useAsyncQuery <T> (query: TQuery<T>, variables?: TVariables<T>, clientId?: string): AsyncData<T, Error>
export function useAsyncQuery <T> (opts: TAsyncQuery<T>): AsyncData<T, Error>

export function useAsyncQuery <T> (...args: any) {
  const { key, initialCache, fn } = prep(...args)
  return key ? useAsyncData<T>(key, fn, { initialCache }) : useAsyncData<T>(fn, { initialCache })
}

export function useLazyAsyncQuery <T> (query: TQuery<T>, clientId?: string): AsyncData<T, Error>
export function useLazyAsyncQuery <T> (query: TQuery<T>, variables?: TVariables<T>, clientId?: string): AsyncData<T, Error>
export function useLazyAsyncQuery <T> (opts: TAsyncQuery<T>): AsyncData<T, Error>

export function useLazyAsyncQuery <T> (...args: any) {
  const { key, initialCache, fn } = prep(...args)
  return key ? useLazyAsyncData<T>(key, fn, { initialCache }) : useLazyAsyncData<T>(fn, { initialCache })
}

const prep = (...args: any) => {
  const { clients } = useApollo()

  const key = args?.[0]?.key || undefined
  const query = args?.[0]?.query || args?.[0]
  const initialCache = args?.[0]?.cache || false
  let clientId = args?.[0]?.clientId || (typeof args?.[1] === 'string' && args?.[1]) || 'default'
  const variables = args?.[0]?.variables || (typeof args?.[1] !== 'string' && args?.[1]) || undefined

  if (clientId !== 'default' && !Object.keys(clients).includes(clientId)) {
    console.log(`[@nuxtjs/apollo] Apollo client \`${clientId}\` not found. Falling back to \`default\`.`)
    clientId = 'default'
  }

  const fn = () => clients?.[clientId].query({ query, variables, ...(!initialCache && { fetchPolicy: 'no-cache' }) }).then(r => r.data)

  return { key, query, initialCache, clientId, variables, fn }
}

export const useApollo = () => {
  const nuxtApp = useNuxtApp() as NuxtAppApollo
  const apolloConfig = useRuntimeConfig()?.public?.apollo as NuxtApolloConfig

  const getToken = (tokenName?: string, client?: string) => {
    if (!tokenName) {
      tokenName = apolloConfig?.clientConfigs?.[client || 'default']?.tokenName
    }

    return useCookie(tokenName).value
  }
  type TAuthUpdate = {token?: string, client?: string, mode: 'login' | 'logout', skipResetStore?: boolean}
  const updateAuth = async ({ token, client, mode, skipResetStore }: TAuthUpdate) => {
    client = client || 'default'

    const tokenName = client && apolloConfig.clientConfigs?.[client]?.tokenName
    const cookieOpts = (client && apolloConfig.clientConfigs?.[client]?.cookieAttributes) || apolloConfig?.cookieAttributes

    const cookie = useCookie(tokenName, cookieOpts)

    if (!cookie.value && mode === 'logout') { return }

    cookie.value = (mode === 'login' && token) || undefined

    if (nuxtApp._apolloWsClients[client]) { nuxtApp._apolloWsClients[client].restart() }

    if (skipResetStore) { return }

    await nuxtApp?._apolloClients?.[client].resetStore().catch(e => console.log('%cError on cache reset', 'color: orange;', e.message))
  }

  return {
    getToken,
    clients: nuxtApp?._apolloClients,
    onLogin: (token?: string, client?: string, skipResetStore?: boolean) => updateAuth({ token, client, skipResetStore, mode: 'login' }),
    onLogout: (client?: string, skipResetStore?: boolean) => updateAuth({ client, skipResetStore, mode: 'logout' })
  }
}
