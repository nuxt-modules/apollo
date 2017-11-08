# Apollo

> Nuxt.js module to use [vue-apollo](https://github.com/Akryum/vue-apollo) (integrates graphql-tag loader to parse `.gql` & `.graphql` files)

[![npm version](https://img.shields.io/npm/v/@nuxtjs/apollo.svg)](https://www.npmjs.com/package/@nuxtjs/apollo)
[![license](https://img.shields.io/github/license/nuxt-community/apollo-module.svg)](https://github.com/nuxt-community/apollo-module/blob/master/LICENSE)


## Setup

Install apollo module:

```bash
npm install --save @nuxtjs/apollo
```

Add `@nuxtjs/apollo` to `modules` section of `nuxt.config.js`

```js
{
  // Add apollo module
  modules: ['@nuxtjs/apollo'],

  // Give apollo module options
  apollo: {
    clientConfigs: {
      default: '~/apollo/clientConfigs/default.js'
    }
  }
}
```

## Options

- clientConfig: `Object` Config passed to ApolloClient
  - default: `String`
  - [otherClient]: `String` or `Object`

Example (`nuxt.config.js`):
```js
module.exports = {
  modules: ['@nuxtjs/apollo'],
  apollo: {
    clientConfigs: {
      default: '~/apollo/client-configs/default.js',
      test: '~/apollo/client-configs/test.js'
    }
  }
}
```

Then in `~/apollo/client-configs/default.js`:

```js
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'

export default (ctx) => {
  const httpLink = new HttpLink({ uri: 'http://localhost:8000/graphql' })

  // auth token
  let token = ctx.isServer ? ctx.req.session : window.__NUXT__.state.session

  // middleware
  const middlewareLink = new ApolloLink((operation, forward) => {
    operation.setContext({
      headers: { authorization: `Bearer ${token}` }
    })
    return forward(operation)
  })
  const link = middlewareLink.concat(httpLink)
  return {
    link,
    cache: new InMemoryCache()
  }
}
```

## Usage

See [Official example](https://github.com/nuxt/nuxt.js/tree/dev/examples/vue-apollo) and [vue-apollo](https://github.com/Akryum/vue-apollo).


### Upgrade notice v2 => v3

Version 3 of this module is using apollo-client 2.x. You need to make sure to update all your middle/afterware according to the upgrade guide of apollo-client. Check this source for a reference: https://github.com/apollographql/apollo-client/blob/master/Upgrade.md
