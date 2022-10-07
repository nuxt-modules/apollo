import { hash } from 'ohash'
import { print } from 'graphql'
import type { OperationVariables, QueryOptions } from '@apollo/client'
import type { AsyncData } from 'nuxt/dist/app/composables'
import type { NuxtAppApollo } from '../types'
import { ref, useCookie, useNuxtApp, useAsyncData, useLazyAsyncData } from '#imports'
import NuxtApollo from '#build/apollo'

type TQuery<T> = QueryOptions<OperationVariables, T>['query']
type TVariables<T> = QueryOptions<OperationVariables, T>['variables']
type TAsyncQuery<T> = {
  query: TQuery<T>,
  variables?: TVariables<T>,
  key?: string,
  cache?: boolean
  clientId?: string
}

export function useAsyncQuery <T> (opts: TAsyncQuery<T>): AsyncData<T, Error>
export function useAsyncQuery <T> (query: TQuery<T>, clientId?: string): AsyncData<T, Error>
export function useAsyncQuery <T> (query: TQuery<T>, variables?: TVariables<T>, clientId?: string): AsyncData<T, Error>

export function useAsyncQuery <T> (...args: any) {
  const { key, initialCache, fn } = prep(...args)
  return useAsyncData<T>(key, fn, { initialCache })
}

export function useLazyAsyncQuery <T> (opts: TAsyncQuery<T>): AsyncData<T, Error>
export function useLazyAsyncQuery <T> (query: TQuery<T>, clientId?: string): AsyncData<T, Error>
export function useLazyAsyncQuery <T> (query: TQuery<T>, variables?: TVariables<T>, clientId?: string): AsyncData<T, Error>

export function useLazyAsyncQuery <T> (...args: any) {
  const { key, initialCache, fn } = prep(...args)
  return useLazyAsyncData<T>(key, fn, { initialCache })
}

const prep = (...args: any) => {
  const { clients } = useApollo()

  const query = args?.[0]?.query || args?.[0]
  const initialCache = args?.[0]?.cache ?? true
  const clientId = args?.[0]?.clientId || (typeof args?.[1] === 'string' && args?.[1]) || clients?.default ? 'default' : Object.keys(clients)[0]
  const variables = args?.[0]?.variables || (typeof args?.[1] !== 'string' && args?.[1]) || undefined

  const key = args?.[0]?.key || hash({ query: print(query), variables, clientId })

  const fn = () => clients?.[clientId].query({ query, variables, fetchPolicy: 'no-cache' }).then(r => r.data)

  return { key, query, initialCache, clientId, variables, fn }
}

export const useApollo = () => {
  const nuxtApp = useNuxtApp() as NuxtAppApollo & ReturnType<typeof useNuxtApp>

  const getToken = async (client?: string) => {
    const conf = NuxtApollo?.clients?.[client || 'default']

    const token = ref<string>()
    await nuxtApp.callHook('apollo:auth', { token, client })

    if (token.value) { return token.value }

    const tokenName = conf?.tokenName

    return conf?.tokenStorage === 'cookie' ? useCookie(tokenName).value : (process.client && localStorage.getItem(tokenName)) || undefined
  }
  type TAuthUpdate = {token?: string, client?: string, mode: 'login' | 'logout', skipResetStore?: boolean}
  const updateAuth = async ({ token, client, mode, skipResetStore }: TAuthUpdate) => {
    client = client || 'default'

    const conf = NuxtApollo?.clients?.[client]

    const tokenName = client && conf?.tokenName

    if (conf?.tokenStorage === 'cookie') {
      const cookieOpts = (client && conf?.cookieAttributes) || NuxtApollo?.cookieAttributes

      const cookie = useCookie(tokenName, cookieOpts)

      if (!cookie.value && mode === 'logout') { return }

      cookie.value = (mode === 'login' && token) || undefined
    } else if (process.client && conf?.tokenStorage === 'localStorage') {
      if (mode === 'login' && token) {
        localStorage.setItem(tokenName, token)
      } else if (mode === 'logout') {
        localStorage.removeItem(tokenName)
      }
    }

    if (nuxtApp._apolloWsClients[client]) { nuxtApp._apolloWsClients[client].restart() }

    if (skipResetStore) { return }

    await nuxtApp?._apolloClients?.[client].resetStore().catch(e => console.log('%cError on cache reset', 'color: orange;', e.message))
  }

  return {
    /**
     * Retrieve the auth token for the specified client. Adheres to the `apollo:auth` hook.
     *
     * @param {string} client The client who's token to retrieve. Defaults to `default`.
     */
    getToken,

    /**
     * Access the configured apollo clients.
     */
    clients: nuxtApp?._apolloClients,

    /**
     * Apply auth token to the specified Apollo client, and optionally reset it's cache.
     *
     * @param {string} token The token to be applied.
     * @param {string} client - Name of the Apollo client. Defaults to `default`.
     * @param {boolean} skipResetStore - If `true`, the cache will not be reset.
     * */
    onLogin: (token?: string, client?: string, skipResetStore?: boolean) => updateAuth({ token, client, skipResetStore, mode: 'login' }),

    /**
     * Remove the auth token from the Apollo client, and optionally reset it's cache.
     *
     * @param {string} client - Name of the Apollo client. Defaults to `default`.
     * @param {boolean} skipResetStore - If `true`, the cache will not be reset.
     * */
    onLogout: (client?: string, skipResetStore?: boolean) => updateAuth({ client, skipResetStore, mode: 'logout' })
  }
}
