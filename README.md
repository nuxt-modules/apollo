# Apollo inside of NuxtJS

* Nuxt.js module to use [vue-apollo](https://github.com/Akryum/vue-apollo)
* uses internally same approach as [vue-cli-plugin-apollo](https://github.com/Akryum/vue-cli-plugin-apollo)

[![npm version](https://img.shields.io/npm/v/@nuxtjs/apollo.svg)](https://www.npmjs.com/package/@nuxtjs/apollo)
[![license](https://img.shields.io/github/license/nuxt-community/apollo-module.svg)](https://github.com/nuxt-community/apollo-module/blob/master/LICENSE)


## Warning

This version requires Vue 2.6+ with serverPrefetch support. For example:

```bash
npm install --save vue@2.6.6 vue-template-compiler@2.6.6 vue-server-renderer@2.6.6
```
Sometime you may need to remove/rebuild package-lock.json/yarn.lock to make it work.

## Setup

### 1- Install apollo module

```bash
npm install --save @nuxtjs/apollo
```

or 

```bash
yarn add @nuxtjs/apollo
```

### 2- Load `@nuxtjs/apollo` module

```js
// nuxt.config.js

export default {
  modules: [
    '@nuxtjs/apollo',
  ],

  apollo: {
    clientConfigs: {
      default: {
        httpEndpoint: 'http://localhost:4000',
      }
    }
  }
}
```

### 3- Loading `*.gql` or `*.graphql` files _(optional)_

Install `graphql-tag`
   
```bash
npm install --save graphql-tag
```

or 

```bash
yarn add graphql-tag
```

#### :warning: Typescript users

Add a `gql.d.ts` file in your sources folder with the following content:
```typescript
declare module '*.gql' {
  import { DocumentNode } from 'graphql'

  const content: DocumentNode
  export default content
}

declare module '*.graphql' {
  import { DocumentNode } from 'graphql'

  const content: DocumentNode
  export default content
}
```

## Usage

You have a successfully enabled `vue-apollo` in your project. 

Checkout [Official example](https://github.com/nuxt/nuxt.js/tree/dev/examples/vue-apollo) and [vue-apollo](https://apollo.vuejs.org/guide/apollo) official documentation for how to use `vue-apollo` inside your application

## Advanced configuration

```js
{
  // Add apollo module
  modules: ['@nuxtjs/apollo'],

  apollo: {
    // Sets up the apollo client endpoints
    clientConfigs: {
      // recommended: use a file to declare the client configuration (see below for example)
      default: '~/plugins/my-alternative-apollo-config.js',

      // you can setup multiple clients with arbitrary names
      alternativeClient: {
        // required
        httpEndpoint: 'http://localhost:4000',

        // override HTTP endpoint in browser only
        browserHttpEndpoint: '/graphql',

        // See https://www.apollographql.com/docs/link/links/http.html#options
        httpLinkOptions: {
          credentials: 'same-origin'
        },

        // You can use `wss` for secure connection (recommended in production)
        // Use `null` to disable subscriptions
        wsEndpoint: 'ws://localhost:4000',

        // LocalStorage token
        tokenName: 'apollo-token',

        // Enable Automatic Query persisting with Apollo Engine
        persisting: false,

        // Use websockets for everything (no HTTP)
        // You need to pass a `wsEndpoint` for this to work
        websocketsOnly: false
      },
    },
    
    /**
     * default 'apollo' definition
     */
    defaultOptions: {
      // See 'apollo' definition
      // For example: default query options
      $query: {
        loadingKey: 'loading',
        fetchPolicy: 'cache-and-network',
      },
    },
    
    // setup a global query loader observer (see below for example)
    watchLoading: '~/plugins/apollo-watch-loading-handler.js',
    
    // setup a global error handler (see below for example)
    errorHandler: '~/plugins/apollo-error-handler.js',

    // Sets the authentication type for any authorized request.
    authenticationType: 'Bearer', 

    // Token name for the cookie which will be set in case of authentication
    tokenName: 'apollo-token',

    // [deprecated] Enable the graphql-tag/loader to parse *.gql/*.graphql files
    includeNodeModules: true,

    // Cookie parameters used to store authentication token
    cookieAttributes: {
      /**
        * Define when the cookie will be removed. Value can be a Number
        * which will be interpreted as days from time of creation or a
        * Date instance. If omitted, the cookie becomes a session cookie.
        */
      expires: 7,

      /**
        * Define the path where the cookie is available. Defaults to '/'
        */
      path: '/',

      /**
        * Define the domain where the cookie is available. Defaults to
        * the domain of the page where the cookie was created.
        */
      domain: 'example.com',

      /**
        * A Boolean indicating if the cookie transmission requires a
        * secure protocol (https). Defaults to false.
        */
      secure: false,
    },
  }
}

```

#### Apollo `clientOptions` using file configuration

:warning: In case you need to declare functions (like `getAuth` or `inMemoryCacheOptions.fragmentMatcher`) inside apollo configuration, you **MUST** define your `clientOptions` using an external file

```js
// ~/plugins/my-alternative-apollo-config.js

export default (context) => {
  return {
    httpEndpoint: 'http://localhost:4000/graphql-alt',

    /*
     * For permanent authentication provide `getAuth` function.
     * The string returned will be used in all requests as authorization header
     */
    getAuth: () => 'Bearer my-static-token',
  }
}
```


#### `watchLoading` example

```js
// ~/plugins/apollo-watch-loading-handler.js

export default (isLoading, countModifier, nuxtContext) => {
  loading += countModifier
  console.log('Global loading', loading, countModifier)
}

```

#### `errorHandler` example

```js
// ~/plugins/apollo-error-handler.js

export default ({ graphQLErrors, networkError, operation, forward }, nuxtContext) => {
  console.log('Global error handler')
  console.log(graphQLErrors, networkError, operation, forward)
}

```

## Options
You can either (in a simple setup) just add an object as described above. If you need to overwrite cache or the default `getAuth()` function then use a path to your config file which returns the client config options.
### clientConfigs `Option`: required
Sets up the apollo client endpoints. All available options for each endpoint you find [here](https://github.com/Akryum/vue-cli-plugin-apollo/blob/master/graphql-client/src/index.js#L15)

Check out [official vue-apollo-cli](https://github.com/Akryum/vue-cli-plugin-apollo) where possible usecases are presented.

#### clientConfigs.default `Object`: required

#### clientConfigs.<your-additional-client-key> `Object|Path`: optional

### tokenName `String`: optional, default: 'apollo-token'

Token name for the cookie which will be set in case of authentication. You can also provide an option `tokenName` in each of your `clientConfigs` to overwrite the default. When each request is made, the value of whatever is in this cooke will be sent in an "Authorization" HTTP header as specified by `authenticationType` below.

### authenticationType `String`: optional, default: 'Bearer'

Sets the authentication type for any authorized request. Modify this if the authentication type your GraphQL API requires is not the default `Bearer`. All requests will then be sent with the appropriate HTTP header in the format: "Authorization: <authenticationType> <your token taken from user cookies>" (Eg. `Authorization: Bearer abc123`). 
  
If your backend requires an Authorization header in the format "Authorization: <your token>", without any prefix, then you should set this value to an empty string.

### includeNodeModules `Boolean`: optional, default: false

In case you use `*.gql` files inside of `node_module` folder you can enable the `graphql-tag/loader` to parse the files for you.


## Authentication

You have following methods for authentication available:
```js
 // set your graphql-token
 this.$apolloHelpers.onLogin(token /* if not default you can pass in client as second argument, you can set custom cookies attributes object as the third argument, and you can skip reset store as the fourth argument */)
 // unset your graphql-token
 this.$apolloHelpers.onLogout(/* if not default you can pass in client as first argument, and you can skip reset store as the second argument */)
 // get your current token (we persist token in a cookie)
 this.$apolloHelpers.getToken(/* you can provide named tokenName if not 'apollo-token' */)
```
Check out the [full example](https://github.com/nuxt-community/apollo-module/tree/master/test/fixture)


#### User login
```js
// ~/components/my-component.js

export default {
  methods: {
    async onSubmit () {
      const credentials = this.credentials
      try {
          const res = await this.$apollo.mutate({
              mutation: authenticateUserGql,
              variables: credentials
          }).then(({data}) => data && data.authenticateUser)
          await this.$apolloHelpers.onLogin(res.token)
      } catch (e) {
          console.error(e)
      }
    },
  }
}
```

#### User logout
```js
// ~/components/my-component.js

export default {
  methods: {
    async onLogout () {
      await this.$apolloHelpers.onLogout()
    },
  }
}
```

#### getToken
```js
// ~/middleware/isAuth.js

export default ({app, error}) => {
  const hasToken = !!app.$apolloHelpers.getToken()
  if (!hasToken) {
    error({
      errorCode:503, 
      message:'You are not allowed to see this'
    })
  }
}
```

#### Examples to access the defaultClient of your apolloProvider
##### Vuex actions
```js
// ~/store/my-store.js

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
// ~/components/my-component.js

export default {
  asyncData (context) {
    let client = context.app.apolloProvider.defaultClient
  }
}
```

##### nuxtServerInit
```js
export default {
  nuxtServerInit (store, context) {
    let client = context.app.apolloProvider.defaultClient
  }
}
```


##### access client or call mutations and queries of any method inside of component
```js
// ~/components/my-component.js

export default {
  methods: {
    foo () {
      // receive the associated Apollo client 
      const client = this.$apollo.getClient()

      // most likely you would call mutations like following:
      this.$apollo.mutate({mutation, variables})
      
      // but you could also call queries like this:
      this.$apollo.query({query, variables})
        .then(({ data }) => {
          // do what you want with data
        })
    }
  }
}
```

Once you get the client, you can access its methods and properties. See [API Reference](https://vue-apollo.netlify.com/api/dollar-apollo.html)

#### Smart queries on any component
```js
// nuxt.config.js

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

See [vue-apollo documentation](https://vue-apollo.netlify.com/guide/apollo/queries.html) for more information on smart queries

#### Add GQL file recognition on node_modules
```js
// nuxt.config.js

export default {
  apollo: {
    clientConfigs: {
      default: '~/apollo/client-configs/default.js'
    },
    includeNodeModules: true
  }
}
```

## Upgrade

### Upgrade Guide apollo-module v3 => v4

Version 4 of this module leaves you with zero configuration. This means we use the best possible approach available from `vue-cli-plugin-apollo` and the same configuration behaviour. This means you don't need to wire up your own configuration, simply pass 

Edit your configuration as following:
```js
// nuxt.config.js

export default {
  apollo: {
    clientConfigs: {
      default:{
        httpEndpoint: YOUR_ENDPOINT,
        wsEndpoint: YOUR_WS_ENDPOINT
      }
    }
  }
}

```

### Upgrade Guide apollo-client v1 => v2

Version 3 of this module is using apollo-client 2.x. You need to make sure to update all your middle/afterware according to the upgrade guide of apollo-client. Check this source for a reference: https://www.apollographql.com/docs/apollo-server/migration-two-dot/

## Troubleshooting 

### Proxies

CORS errors are most often resolved with proxies.  If you see a Cross-Origin-Request error in your client side console look into setting up a proxy.  Check out https://github.com/nuxt-community/proxy-module for quick and straight forward setup.

###  ctx.req.session - req is undefined

This is just a placeholder.  You'll want to replace it with whatever storage mechanism you choose to store your token.
Here is an example using local storage : https://github.com/Akryum/vue-apollo/issues/144

## Contribute and wire up setup

Setup the required fields in `.env` file in root folder

```bash
# cat .env
HTTP_ENDPOINT=https://your-endpoint
WS_ENDPOINT=wss://your-endpoint
```

In `index.vue` the login process requires that the gql endpoint enables a mutation which returns a valid token:
```gql
mutation authenticateUser($email:String!,$password:String!){
    authenticateUser(email: $email, password: $password) {
        token
        id
    }
}
```

If your gql backend is prepared start running nuxt as follow
```bash
npm install
npm run dev
```
