import { hash } from 'ohash'
import { print } from 'graphql'
import type { ApolloClient, OperationVariables, QueryOptions, DefaultContext } from '@apollo/client'
import type { AsyncData, AsyncDataOptions, NuxtError } from 'nuxt/app'
import type { RestartableClient } from './ws'
import { ref, isRef, reactive, useCookie, useNuxtApp, useAsyncData } from '#imports'
import { NuxtApollo } from '#apollo'
import type { ApolloClientKeys } from '#apollo'

type PickFrom<T, K extends Array<string>> = T extends Array<any> ? T : T extends Record<string, any> ? keyof T extends K[number] ? T : K[number] extends never ? T : Pick<T, K[number]> : T
type KeysOf<T> = Array<T extends T ? keyof T extends string ? keyof T : never : never>

type TQuery<T> = QueryOptions<OperationVariables, T>['query']
type TVariables<T> = QueryOptions<OperationVariables, T>['variables'] | null
type TAsyncQuery<T> = {
  key?: string
  query: TQuery<T>
  variables?: TVariables<T>
  clientId?: ApolloClientKeys
  context?: DefaultContext
  cache?: boolean
}

export function useAsyncQuery <
  T,
  DataT = T,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
  NuxtErrorDataT = unknown
> (opts: TAsyncQuery<T>, options?: AsyncDataOptions<T, DataT, PickKeys, DefaultT>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>

export function useAsyncQuery <
  T,
  DataT = T,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
  NuxtErrorDataT = unknown
> (query: TQuery<T>, variables?: TVariables<T>, clientId?: ApolloClientKeys, context?: DefaultContext, options?: AsyncDataOptions<T, DataT, PickKeys, DefaultT>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>

export function useAsyncQuery <T> (...args: any[]) {
  const { key, fn, options } = prep<T>(...args)
  return useAsyncData<T>(key, fn, options)
}

export function useLazyAsyncQuery <
  T,
  DataT = T,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
  NuxtErrorDataT = unknown
> (opts: TAsyncQuery<T>, options?: AsyncDataOptions<T, DataT, PickKeys, DefaultT>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>

export function useLazyAsyncQuery <
  T,
  DataT = T,
  PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
  DefaultT = null,
  NuxtErrorDataT = unknown
> (query: TQuery<T>, variables?: TVariables<T>, clientId?: string, context?: DefaultContext, options?: AsyncDataOptions<T, DataT, PickKeys, DefaultT>): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, (NuxtErrorDataT extends Error | NuxtError ? NuxtErrorDataT : NuxtError<NuxtErrorDataT>) | null>

export function useLazyAsyncQuery <T> (...args: any) {
  const { key, fn, options } = prep<T>(...args)
  return useAsyncData<T>(key, fn, { ...options, lazy: true })
}

const prep = <T> (...args: any[]) => {
  const { clients } = useApollo()

  let query: TQuery<T>
  let variables: TVariables<T>

  let cache: boolean
  let clientId: ApolloClientKeys | undefined
  let context: DefaultContext

  let options: AsyncDataOptions<T, T, KeysOf<T>, null> = {}

  if ((typeof args?.[0] === 'object' && 'query' in args[0])) {
    query = args?.[0]?.query
    variables = args?.[0]?.variables

    cache = args?.[0]?.cache
    context = args?.[0]?.context
    clientId = args?.[0]?.clientId

    if (typeof args?.[1] === 'object') {
      options = args?.[1]
    }
  } else {
    query = args?.[0]
    variables = args?.[1]

    clientId = args?.[2]
    context = args?.[3]

    if (typeof args?.[4] === 'object') {
      options = args?.[4]
    }
  }

  if (!query) { throw new Error('@nuxtjs/apollo: no query provided') }

  if (!clientId || !clients?.[clientId]) {
    clientId = (clients?.default ? 'default' : Object.keys(clients!)?.[0]) as ApolloClientKeys

    if (!clientId) { throw new Error('@nuxtjs/apollo: no client found') }
  }

  if (variables) {
    variables = isRef(variables) ? variables : reactive(variables)

    options.watch = options.watch || []
    options.watch.push(variables)
  }

  const key = args?.[0]?.key || hash({ query: print(query), variables, clientId })

  const fn = () => clients![clientId!]?.query<T>({
    query,
    variables: variables || undefined,
    ...(cache && { fetchPolicy: 'cache-first' }),
    context
  }).then(r => r.data)

  return { key, query, clientId, variables, fn, options }
}

export function useApollo (): {
  clients: Record<ApolloClientKeys, ApolloClient<any>> | undefined
  getToken: (client?: ApolloClientKeys) => Promise<string | null | undefined>
  onLogin: (token?: string, client?: ApolloClientKeys, skipResetStore?: boolean) => Promise<void>
  onLogout: (client?: ApolloClientKeys, skipResetStore?: boolean) => Promise<void>
}

export function useApollo () {
  const nuxtApp = useNuxtApp() as {
    _apolloClients?: Record<ApolloClientKeys, ApolloClient<any>>;
    _apolloWsClients?: Record<ApolloClientKeys, RestartableClient>;
  }

  const getToken = async (client?: ApolloClientKeys) => {
    client = client || 'default'

    const conf = NuxtApollo?.clients?.[client]

    const token = ref<string | null>(null)
    await (nuxtApp as ReturnType<typeof useNuxtApp>).callHook('apollo:auth', { token, client })

    if (token.value) { return token.value }

    const tokenName = conf.tokenName!

    return conf?.tokenStorage === 'cookie' ? useCookie(tokenName).value : (process.client && localStorage.getItem(tokenName)) || null
  }
  type TAuthUpdate = {token?: string, client?: ApolloClientKeys, mode: 'login' | 'logout', skipResetStore?: boolean}
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

    // eslint-disable-next-line no-console
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
    onLogin: (token?: string, client?: ApolloClientKeys, skipResetStore?: boolean) => updateAuth({ token, client, skipResetStore, mode: 'login' }),

    /**
     * Remove the auth token from the Apollo client, and optionally reset it's cache.
     *
     * @param {string} client - Name of the Apollo client. Defaults to `default`.
     * @param {boolean} skipResetStore - If `true`, the cache will not be reset.
     * */
    onLogout: (client?: ApolloClientKeys, skipResetStore?: boolean) => updateAuth({ client, skipResetStore, mode: 'logout' })
  }
}
