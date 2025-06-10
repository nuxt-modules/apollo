import type { ClientOptions } from 'graphql-ws'
import type { HttpOptions, DefaultOptions, InMemoryCacheConfig } from '@apollo/client'
import type { CookieOptions } from 'nuxt/app'
export type { ErrorResponse } from '@apollo/client/link/error'

type CookieAttributes = Omit< CookieOptions, 'encode' | 'decode' | 'expires' | 'default'>;

export type ClientConfig = {
  /**
   * The GraphQL endpoint.
   * @type {string}
   */
  httpEndpoint: string;

  /**
   * Provide a GraphQL endpoint to be used client-side. Overrides `httpEndpoint`.
   * @type {string}
   **/
  browserHttpEndpoint?: string;

  /**
   * Provide additional configuration for the `HttpLink`.
   * See https://www.apollographql.com/docs/link/links/http.html#options
   * @type {HttpOptions}
   **/
  httpLinkOptions?: Omit<HttpOptions, 'uri'>;

  /**
   * Provide additional configuration for the `GraphQLWsLink`.
   * See https://github.com/enisdenjo/graphql-ws/blob/master/docs/interfaces/client.ClientOptions.md
   **/
  wsLinkOptions?: Omit<ClientOptions, 'url'>;

  /**
   * Specify a websocket endpoint to be used for subscriptions.
   * The `wss` protocol is recommended in production.
   * @type {string}
   **/
  wsEndpoint?: string;

  // Enable Automatic Query persisting with Apollo Engine
  // persisting?: boolean

  /**
   * Specify if the client should solely use WebSocket.
   * requires `wsEndpoint`.
   * @type {boolean}
   * @default false
   **/
  websocketsOnly?: boolean;

  /**
   * Specify if the client should be able to connect to the Apollo Client Devtools in production mode.
   * @type {boolean}
   * @default false
   **/
  connectToDevTools?: boolean;

  /**
   * Configure default options to be applied to the apollo client.
   **/
  defaultOptions?: DefaultOptions;

  /**
   * Configure the in-memory cache.
   **/
  inMemoryCacheOptions?: InMemoryCacheConfig;

  /**
   * Specify the name under which the token will be stored.
   * as in either a cookie or localStorage.
   * @type {string}
   * @default "apollo:<client-name>.token"
   */
  tokenName?: string;

  /**
   * Specify if the auth token should be stored in `cookie` or `localStorage`.
   * `Cookie` storage is required for SSR.
   * @type {string}
   * @default "cookie"
   **/
  tokenStorage?: 'cookie' | 'localStorage';

  /**
   * Specify the Authentication scheme.
   * @type {string}
   * @default "Bearer"
   **/
  authType?: string | null;

  /**
   * Name of the Authentication token header.
   * @type {string}
   * @default "Authorization"
   */
  authHeader?: string;

  /**
   * Configuration for the auth cookie.
   **/
  cookieAttributes?: CookieAttributes;
};

export interface NuxtApolloConfig<T = false> {
  /**
   * Determine if vue-apollo composables should be automatically imported.
   * @type {boolean}
   * @default true
   **/
  autoImports?: boolean;

  /**
   * Configuration of the Apollo clients.
   **/
  clients?: Record< string, T extends false ? string | ClientConfig : ClientConfig >;

  /**
   * Default options to be applied to all Apollo clients.
   * This is useful for setting global defaults, and is overridden by `defaultOptions` passed directly to clients.
   **/
  defaultOptions?: DefaultOptions;

  /**
   * Pass cookies from the browser to the GraphQL API in SSR mode.
   *
   * @type boolean
   * @default true
   * */
  proxyCookies?: boolean;

  /**
   * Specify the Authentication scheme.
   * @type {string}
   * @default 'Bearer'
   **/
  authType?: string;

  /**
   * Name of the Authentication token header.
   * @type {string}
   * @default "Authorization"
   */
  authHeader?: string;

  /**
   * Specify if the auth token should be stored in `cookie` or `localStorage`.
   * `Cookie` storage is required for SSR.
   * @type {string}
   * @default "cookie"
   **/
  tokenStorage?: 'cookie' | 'localStorage';

  /**
   * Configuration for the auth cookie.
   **/
  cookieAttributes?: CookieAttributes;

  /**
   * Apollo client awareness instructs the client to send two additional headers
   * `apollographql-client-name` and `apollographql-client-version` in each HTTP request.
   * This behavior is disabled by default.
   * @type {boolean}
   * @default false
   */
  clientAwareness?: boolean
}
