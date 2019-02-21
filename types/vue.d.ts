/**
 * Extends interfaces in Vue.js
 */

import Vue from 'vue';
import { ApolloClient } from 'apollo-client';
import { CookieAttributes } from 'js-cookie';

declare module 'vue/types/vue' {
  interface Vue {
    $apolloHelpers: {
      onLogin(
        token: string,
        apolloClient?: ApolloClient<{}>,
        attributes?: CookieAttributes
      ): Promise<void>;
      onLogout(apolloClient?: ApolloClient<{}>): Promise<void>;
      getToken(tokenName?: string): string;
    };
  }
}
