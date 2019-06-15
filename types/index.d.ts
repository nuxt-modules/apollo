import ApolloClient from 'apollo-client'

import './vue'
import './nuxt'

export interface ApolloHelpers {
  onLogin(
    token: string,
    apolloClient?: ApolloClient<any>,
    tokenExpires?: number
  ): Promise<void>
  onLogout(apolloClient?: ApolloClient<any>): Promise<void>
  getToken(tokenName?: string): string
}
