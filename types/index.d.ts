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
    cookieAttributes?: number | CookieAttributes
  ): Promise<void>;
  onLogout(apolloClient?: ApolloClient<any>): Promise<void>;
  getToken(tokenName?: string): string;
}
