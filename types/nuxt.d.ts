/**
 * Extends interfaces in Nuxt
 */

import { VueApolloComponentOptions } from 'vue-apollo/types/options'
import { ApolloProvider } from 'vue-apollo/types/apollo-provider'
import { ApolloClientClientConfig } from 'vue-cli-plugin-apollo/graphql-client'
import Vue, { ComponentOptions } from 'vue'
import { ApolloHelpers, CookieAttributes } from '.'

export interface ApolloClientConfig extends ApolloClientClientConfig<any> {
  httpEndpoint: string
  websocketsOnly?: boolean
}

interface NuxtApolloConfiguration {
  tokenName?: string
  cookieAttributes?: CookieAttributes
  tokenExpires?: number
  includeNodeModules?: boolean
  authenticationType?: string
  errorHandler?: string
  watchLoading?: string
  defaultOptions?: VueApolloComponentOptions<any>
  clientConfigs: {
    default: ApolloClientConfig | string
    [key: string]: ApolloClientConfig | string
  }
}

declare module '@nuxt/config' {
  interface NuxtConfiguration {
    apollo?: NuxtApolloConfiguration
  }
}

declare module '@nuxt/vue-app' {
  interface NuxtAppOptions extends ComponentOptions<Vue> {
    $apolloHelpers: ApolloHelpers
  }
}

// Nuxt 2.9+
declare module '@nuxt/types' {
  interface Configuration {
    apollo?: NuxtApolloConfiguration
  }
  interface NuxtAppOptions extends ComponentOptions<Vue> {
    $apolloHelpers: ApolloHelpers
    apolloProvider: ApolloProvider
  }
  interface Context {
    $apolloHelpers: ApolloHelpers
  }
}
