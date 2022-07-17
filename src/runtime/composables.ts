import type { OperationVariables, QueryOptions } from '@apollo/client'
import type { AsyncData } from 'nuxt/dist/app/composables'

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
  const { key, initialCache, h } = prep(...args)
  return key ? useAsyncData<T>(key, h, { initialCache }) : useAsyncData<T>(h, { initialCache })
}

export function useLazyAsyncQuery <T> (query: TQuery<T>, clientId?: string): AsyncData<T, Error>
export function useLazyAsyncQuery <T> (query: TQuery<T>, variables?: TVariables<T>, clientId?: string): AsyncData<T, Error>
export function useLazyAsyncQuery <T> (opts: TAsyncQuery<T>): AsyncData<T, Error>

export function useLazyAsyncQuery <T> (...args: any) {
  const { key, initialCache, h } = prep(...args)
  return key ? useLazyAsyncData<T>(key, h, { initialCache }) : useLazyAsyncData<T>(h, { initialCache })
}

const prep = (...args: any) => {
  const { $apollo } = useNuxtApp()

  const key = args?.[0]?.key || undefined
  const query = args?.[0]?.query || args?.[0]
  const initialCache = args?.[0]?.cache || false
  let clientId = args?.[0]?.clientId || (typeof args?.[1] === 'string' && args?.[1]) || 'default'
  const variables = args?.[0]?.variables || (typeof args?.[1] !== 'string' && args?.[1]) || undefined

  if (clientId !== 'default' && !Object.keys($apollo.clients).includes(clientId)) {
    console.log(`[@nuxtjs/apollo] Apollo client \`${clientId}\` not found. Falling back to \`default\`.`)
    clientId = 'default'
  }

  const h = () => $apollo.clients?.[clientId].query({ query, variables, ...(!initialCache && { fetchPolicy: 'no-cache' }) }).then(r => r.data).catch(e => JSON.parse(JSON.stringify(e)))

  return { key, query, initialCache, clientId, variables, h }
}
