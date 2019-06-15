/**
 * Extends interfaces in Vue.js
 */

import Vue from 'vue'
import { ApolloClient } from 'apollo-client'
import { ApolloHelpers } from '.'

declare module 'vue/types/vue' {
  interface Vue {
    $apolloHelpers: ApolloHelpers
  }
}
