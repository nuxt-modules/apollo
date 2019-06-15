/**
 * Extends interfaces in Nuxt
 */

import NuxtConfiguration from '@nuxt/config'
import { VueApolloOptions } from 'vue-apollo/types/options'
import { ApolloClientClientConfig } from 'vue-cli-plugin-apollo/graphql-client'
import Vue, { ComponentOptions } from 'vue'
import { ApolloHelpers } from '.'

declare module '@nuxt/config/types/index' {
  interface ApolloClientConfig extends ApolloClientClientConfig<any> {
    httpEndpoint: string
  }

  export default interface NuxtConfiguration {
    apollo: {
      tokenName?: string
      tokenExpires?: number
      includeNodeModules?: boolean
      authenticationType?: string
      errorHandler?: string
      defaultOptions?: VueApolloOptions<any>
      clientConfigs: {
        default: ApolloClientConfig | string
        [key: string]: ApolloClientConfig | string
      }
    }
  }
}

declare module '@nuxt/vue-app/types/index' {
  interface NuxtAppOptions extends ComponentOptions<Vue> {
    $apolloHelpers: ApolloHelpers
  }
}
