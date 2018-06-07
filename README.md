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

- clientConfig: `Object` Config passed to ApolloClient
  - default: `Object`
  - otherClient: `Object` (Optional)

```js
{
  // Add apollo module
  modules: ['@nuxtjs/apollo'],

  // Give apollo module options
  apollo: {
    clientConfigs: {
      default: {
        httpEndpoint: 'http://localhost:4000',
        // You can use `wss` for secure connection (recommended in production)

        // Use `null` to disable subscriptions
        // wsEndpoint: 'ws://localhost:4000',

        // CookieStorage token
        // tokenName: 'your-token-name',

        // Enable Automatic Query persisting with Apollo Engine
        // persisting: false,

        // Use websockets for everything (no HTTP)
        // You need to pass a `wsEndpoint` for this to work
        // websocketsOnly: false,
    
        // Override default http link
        // link: yourLink,
    
        // Override default cache
        // cache: yourCache,
    
        // Override the way the Authorization header is set
        // getAuth: yourFunction
    
        // Additional ApolloClient options
        // apollo: { ... },
    
        // Client local data (see apollo-link-state)
        // clientState: { resolvers: { ... }, defaults: { ... } }
      },
      anotherone: '~/apollo/client-configs/anotherClient.js',
      anothertwo: {
        httpEndpoint: 'http://localhost:5000'
      }
    }
  }
```

Then in `~/apollo/client-configs/default.js`:

```js	
export default (ctx) => {	
  return {	
    httpEndpoint: 'http://localhost:4000',
    // You can use `wss` for secure connection (recommended in production)

    // Use `null` to disable subscriptions
    // wsEndpoint: 'ws://localhost:4000',

    // CookieStorage token
    // tokenName: 'your-token-name',

    // Enable Automatic Query persisting with Apollo Engine
    // persisting: false,

    // Use websockets for everything (no HTTP)
    // You need to pass a `wsEndpoint` for this to work
    // websocketsOnly: false,

    // Override default http link
    // link: yourLink,

    // Override default cache
    // cache: yourCache,

    // Override the way the Authorization header is set
    // getAuth: yourFunction

    // Additional ApolloClient options
    // apollo: { ... },

    // Client local data (see apollo-link-state)
    // clientState: { resolvers: { ... }, defaults: { ... } }
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

##### asyncData/fetch method of page component
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

## Troubleshooting 

### Proxies

CORS errors are most often resolved with proxies.  If you see a Cross-Origin-Request error in your client side console look into setting up a proxy.  Check out https://github.com/nuxt-community/proxy-module for quick and straight forward setup.

###  ctx.req.session - req is undefined

This is just a placeholder.  You'll want to replace it with whatever storage mechanism you choose to store your token.
Here is an example using local storage : https://github.com/Akryum/vue-apollo/issues/144
