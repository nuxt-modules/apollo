import { hash } from 'ohash'
import { print } from 'graphql'
import type { OperationVariables, QueryOptions, DefaultContext } from '@apollo/client'
import type { AsyncData, NuxtError } from 'nuxt/app'
import type { NuxtAppApollo } from '../types'
import { ref, useCookie, useNuxtApp, useAsyncData } from '#imports'
import NuxtApollo from '#build/apollo'

type PickFrom<T, K extends Array<string>> = T extends Array<any> ? T : T extends Record<string, any> ? keyof T extends K[number] ? T : K[number] extends never ? T : Pick<T, K[number]> : T
type KeysOf<T> = Array<T extends T ? keyof T extends string ? keyof T : never : never>

type TQuery<T> = QueryOptions<OperationVariables, T>['query']
type TVariables<T> = QueryOptions<OperationVariables, T>['variables'] | null
type TAsyncQuery<T> = {
  key?: string
  query: TQuery<T>
  variables?: TVariables<T>
  clientId?: string
  context?: DefaultContext
  cache?: boolean
}

export function useAsyncQuery <
  T,
  DataT = T,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
  NuxtErrorDataT = unknown
> (opts: TAsyncQuery<T>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>

export function useAsyncQuery <
  T,
  DataT = T,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
  NuxtErrorDataT = unknown
> (query: TQuery<T>, variables?: TVariables<T>, clientId?: string, context?: DefaultContext): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>

export function useAsyncQuery <T> (...args: any[]) {
  const { key, fn } = prep<T>(...args)
  return useAsyncData<T>(key, fn)
}

export function useLazyAsyncQuery <
  T,
  DataT = T,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
  NuxtErrorDataT = unknown
> (opts: TAsyncQuery<T>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>

export function useLazyAsyncQuery <
  T,
  DataT = T,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
  NuxtErrorDataT = unknown
> (query: TQuery<T>, variables?: TVariables<T>, clientId?: string, context?: DefaultContext): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>

export function useLazyAsyncQuery <T> (...args: any) {
  const { key, fn } = prep<T>(...args)
  return useAsyncData<T>(key, fn, { lazy: true })
}

const prep = <T> (...args: any[]) => {
  const { clients } = useApollo()

  let query: TQuery<T>
  let variables: TVariables<T>

  let cache: boolean = true
  let clientId: string | undefined
  let context: DefaultContext

  if ((typeof args?.[0] === 'object' && 'query' in args[0])) {
    query = args?.[0]?.query
    variables = args?.[0]?.variables

    cache = args?.[0]?.cache ?? true
    context = args?.[0]?.context
    clientId = args?.[0]?.clientId
  } else {
    query = args?.[0]
    variables = args?.[1]

    clientId = args?.[2]
    context = args?.[3]
  }

  if (!query) { throw new Error('@nuxtjs/apollo: no query provided') }

  if (!clientId || !clients?.[clientId]) {
    clientId = clients?.default ? 'default' : Object.keys(clients!)?.[0]

    if (!clientId) { throw new Error('@nuxtjs/apollo: no client found') }
  }

  const key = args?.[0]?.key || hash({ query: print(query), variables, clientId })

  const fn = () => clients![clientId!]?.query<T>({
    query,
    variables: variables || undefined,
    fetchPolicy: cache ? 'cache-first' : 'no-cache',
    context
  }).then(r => r.data)

  return { key, query, clientId, variables, fn }
}

export const useApollo = () => {
  const nuxtApp = useNuxtApp() as NuxtAppApollo

  const getToken = async (client?: string) => {
    client = client || 'default'

    const conf = NuxtApollo?.clients?.[client]

    const token = ref<string | null>(null)
    await (nuxtApp as ReturnType<typeof useNuxtApp>).callHook('apollo:auth', { token, client })

    if (token.value) { return token.value }

    const tokenName = conf.tokenName!

    return conf?.tokenStorage === 'cookie' ? useCookie(tokenName).value : (process.client && localStorage.getItem(tokenName)) || null
  }
  type TAuthUpdate = {token?: string, client?: string, mode: 'login' | 'logout', skipResetStore?: boolean}
  const updateAuth = async ({ token, client, mode, skipResetStore }: TAuthUpdate) => {
    client = client || 'default'

    const conf = NuxtApollo?.clients?.[client]

    const tokenName = client && conf.tokenName!

    if (conf?.tokenStorage === 'cookie') {
      const cookieOpts = (client && conf?.cookieAttributes) || NuxtApollo?.cookieAttributes

      // @ts-ignore
      const cookie = useCookie(tokenName, cookieOpts)

      if (!cookie.value && mode === 'logout') { return }

      cookie.value = (mode === 'login' && token) || null
    } else if (process.client && conf?.tokenStorage === 'localStorage') {
      if (mode === 'login' && token) {
        localStorage.setItem(tokenName, token)
      } else if (mode === 'logout') {
        localStorage.removeItem(tokenName)
      }
    }

    if (nuxtApp?._apolloWsClients?.[client]) { nuxtApp._apolloWsClients[client].restart() }

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
