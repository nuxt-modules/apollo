import ApolloClient from 'apollo-client'
import { CookieSetOptions } from 'universal-cookie'

import './vue'
import './nuxt'

interface CookieAttributes extends Omit<CookieSetOptions, 'expires'> {
  expires?: number | Date
}

export interface ApolloHelpers {
  onLogin(
    token: string,
    apolloClient?: ApolloClient<any>,
    cookieAttributes?: number | CookieAttributes,
    skipResetStore?: boolean
  ): Promise<void>;
  onLogout(
    apolloClient?: ApolloClient<any>,
    skipResetStore?: boolean
  ): Promise<void>;
  getToken(tokenName?: string): string;
}
