/**
 * Extends interfaces in Vue.js
 */

import Vue from 'vue'
import { ApolloClient } from 'apollo-client'

declare module 'vue/types/vue' {
  interface Vue {
    $apolloHelpers: {
      onLogin (token: string, apolloClient?: ApolloClient<any>, tokenExpires?: number): Promise<void>
      onLogout (apolloClient?: ApolloClient<any>): Promise<void>
      getToken (tokenName?: string): string
    }
  }
}
