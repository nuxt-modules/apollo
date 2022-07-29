import type { ApolloClient, HttpOptions, DefaultOptions, InMemoryCacheConfig } from '@apollo/client'
import { ClientOptions } from 'graphql-ws'
import type { CookieOptions } from 'nuxt/dist/app/composables'
import type { RestartableClient } from './runtime/utils/ws'

type CookieAttributes = Omit<CookieOptions, 'encode' | 'decode' | 'expires' | 'default'>

export type NuxtAppApollo = Partial<{
  _apolloClients?: Record<string, ApolloClient<any>>
  _apolloWsClients?: Record<string, RestartableClient>
}>

export type ClientConfig = {
  // link?: ApolloLink

  // required
  httpEndpoint: string;

  // override HTTP endpoint in browser only
  browserHttpEndpoint?: string;

  // See https://www.apollographql.com/docs/link/links/http.html#options
  httpLinkOptions?: Omit<HttpOptions, 'uri'>;

  wsLinkOptions?: Omit<ClientOptions, 'url' | 'connectionParams'>;

  // You can use `wss` for secure connection (recommended in production)
  // Use `null` to disable subscriptions
  wsEndpoint?: string;

  // Enable Automatic Query persisting with Apollo Engine
  persisting?: boolean;

  // Use websockets for everything (no HTTP)
  // You need to pass a `wsEndpoint` for this to work
  websocketsOnly?: boolean;

  getAuth?: string | (() => string);

  connectToDevTools?: boolean;

  defaultOptions?: DefaultOptions

  inMemoryCacheOptions?: InMemoryCacheConfig;

  tokenName?: string;

  authType?: string

  authHeader?: string;

  cookieAttributes?: CookieAttributes

};

export interface NuxtApolloConfig<T = ClientConfig> {
  components?: boolean;
  autoImports?: boolean;
  // defaultOptions?: ApolloProviderOptions['defaultOptions']
  clientConfigs?: Record<string, T extends boolean ? string | ClientConfig : ClientConfig>;
  defaultOptions?: DefaultOptions
  authType?: string
  authHeader?: string
  cookieAttributes?: CookieAttributes
  errorHandler?: string
}
