import Vue from 'vue'
import { ApolloClient } from 'apollo-client'
import * as types from '../index'

const vm = new Vue()

const apolloClient = new ApolloClient({
  link: 'dummy link' as any,
  cache: 'dummy cache' as any
})

const tokenName = 'foo'
const token = 'bar'
const cookieAttributes = { expires: 2, path: '/', secure: false }

// onLogin

async () => {
  await vm.$apolloHelpers.onLogin(token)
  await vm.$apolloHelpers.onLogin(token, apolloClient)
  await vm.$apolloHelpers.onLogin(token, apolloClient, cookieAttributes)
  await vm.$apolloHelpers.onLogin(token, undefined, cookieAttributes)
}

// onLogout

async () => {
  await vm.$apolloHelpers.onLogout()
  await vm.$apolloHelpers.onLogout(apolloClient)
}

// getToken

vm.$apolloHelpers.getToken()
vm.$apolloHelpers.getToken(tokenName)
