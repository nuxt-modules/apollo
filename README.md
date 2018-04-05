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
      default: '~/apollo/client-configs/default.js'
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

#### Example without subscription

```js
import { ApolloLink } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'

export default (ctx) => {
  const httpLink = new HttpLink({ uri: 'http://localhost:8000/graphql' })


  // middleware
  const middlewareLink = new ApolloLink((operation, forward) => {
    const token = process.server ? ctx.req.session : window.__NUXT__.state.session

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

#### Example with subscription (graph.cool as example)

```js
import { ApolloLink, concat, split } from 'apollo-link'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'
import 'subscriptions-transport-ws' // this is the default of apollo-link-ws

export default (ctx) => {
  const httpLink = new HttpLink({uri: 'https://api.graph.cool/simple/v1/' + process.env.GRAPHQL_ALIAS})
  const authMiddleware = new ApolloLink((operation, forward) => {
    const token = process.server ? ctx.req.session : window.__NUXT__.state.session
    operation.setContext({
      headers: {
        Authorization: token ? `Bearer ${token}` : null
      }
    })
    return forward(operation)
  })
  // Set up subscription
  const wsLink = new WebSocketLink({
    uri: `wss://subscriptions.graph.cool/v1/${process.env.GRAPHQL_ALIAS}`,
    options: {
      reconnect: true,
      connectionParams: () => {
        const token = process.server ? ctx.req.session : window.__NUXT__.state.session
        return {
          Authorization: token ? `Bearer ${token}` : null
        }
      }
    }
  })
  
  const link = split(
    ({query}) => {
      const {kind, operation} = getMainDefinition(query)
      return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    httpLink
  )

  return {
    link: concat(authMiddleware, link),
    cache: new InMemoryCache()
  }
}
```

## Usage

See [Official example](https://github.com/nuxt/nuxt.js/tree/dev/examples/vue-apollo) and [vue-apollo](https://github.com/Akryum/vue-apollo).

#### Examples to access the defaultClient of your apolloProvider
##### Vuex actions
```js
export default {
  actions: {
    foo (store, payload) {
      let client = this.app.apolloProvider.defaultClient
    }
  }
}
```

##### ayncData/fetch method of page component
```js
export default {
  asyncData (context) {
    let client = context.app.apolloProvider.defaultClient
  }
}
```

##### onServerInit
```js
export default {
  nuxtServerInit (store, context) {
    let client = context.app.apolloProvider.defaultClient
  }
}
```


##### access client or call mutations of any method inside of component
```js
export default {
  methods:{
    foo(){
      // receive the associated Apollo client 
      const client = this.$apollo.getClient()

      // most likely you would call mutations like following:
      this.$apollo.mutate({mutation, variables})
    }
  }
}
```

##### query on any component
```js
export default {
  apollo: {
    foo: {
      query: fooGql,
      variables () {
        return {
          myVar: this.myVar
        }
      }
    }
  }
}
```

#### Add GQL file recognition on node_modules
```js
  apollo: {
    clientConfigs: {
      default: '~/apollo/client-configs/default.js'
    },
    includeNodeModules: true
  }
```

## Upgrade
### Upgrade Guide apollo-client v1 => v2

Version 3 of this module is using apollo-client 2.x. You need to make sure to update all your middle/afterware according to the upgrade guide of apollo-client. Check this source for a reference: https://github.com/apollographql/apollo-client/blob/master/Upgrade.md

### Adjust dependencies of package.json
As this package is not taking care of your apollo-link endpoints. Please make sure you add these to your package.json. Most of you will end up adding these packages:
* apollo-link-http
* graphql
* graphql-tag (important if you use *.gql files)

In case of subscriptions:
* apollo-link-ws
* apollo-utilities
* subscriptions-transport-ws

You can add them with one command:
```
npm install --save apollo-link-http graphql graphql-tag apollo-link-ws apollo-utilities subscriptions-transport-ws
```
