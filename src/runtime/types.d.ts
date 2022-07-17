import type {
  // ApolloLink,
  HttpOptions
} from '@apollo/client'
// import type { ApolloProviderOptions } from '@vue/apollo-option/types/apollo-provider'
import { CookieSerializeOptions } from 'cookie-es'

export type ClientConfig = {
  // link?: ApolloLink

  // required
  httpEndpoint: string;

  // override HTTP endpoint in browser only
  browserHttpEndpoint?: string;

  // See https://www.apollographql.com/docs/link/links/http.html#options
  httpLinkOptions?: Omit<HttpOptions, 'uri'>;

  // You can use `wss` for secure connection (recommended in production)
  // Use `null` to disable subscriptions
  wsEndpoint?: string;

  // LocalStorage token
  tokenName?: string;

  // Enable Automatic Query persisting with Apollo Engine
  persisting?: boolean;

  // Use websockets for everything (no HTTP)
  // You need to pass a `wsEndpoint` for this to work
  websocketsOnly?: boolean;

  getAuth?: string | (() => string);

  connectToDevTools?: boolean;
};

type CookieAttributes = Omit<CookieSerializeOptions, 'encode' | 'decode' | 'expires'>

export interface ModuleOptions<T = false> {
  components?: boolean;
  autoImports?: boolean;
  // defaultOptions?: ApolloProviderOptions['defaultOptions']
  clientConfigs?: Record<string, T extends false ? string | ClientConfig : ClientConfig>;
  tokenName?: string;
  cookieAttributes?: CookieAttributes

  // tokenExpires?: number
  // includeNodeModules?: boolean
  authenticationType?: string
  errorHandler?: string
}
