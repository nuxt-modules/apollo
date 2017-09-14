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
    networkInterfaces: {
      default: '~/apollo/network-interfaces/default.js'
    }
  }
}
```

## Options

- networkInterfaces: `Object`
  - default: `String`
  - [otherClient]: `String` or `Object`

Example (`nuxt.config.js`):
```js
module.exports = {
  modules: ['@nuxtjs/apollo'],
  apollo: {
    networkInterfaces: {
      default: '~/apollo/network-interfaces/default.js',
      test: '~/apollo/network-interfaces/test.js'
    }
  }
}
```

Then in `~/apollo/network-interfaces/default.js`:

```js
import { createNetworkInterface } from 'apollo-client'

export default (ctx) => {
  const networkInterface = createNetworkInterface({
    uri: 'https://api.graph.cool/simple/v1/cj1dqiyvqqnmj0113yuqamkuu'
  })
  // here you can place your middleware. ctx has the context forwarded from Nuxt

  // you can return the networkInterface directly or return an object with additional
  // apollo-client options
  // return networkInterface

  // alternative return a object with constructor options of apollo-client
  return {
    networkInterface,
    dataIdFromObject: o => o.id
  }
}
```

## Usage

See [Official example](https://github.com/nuxt/nuxt.js/tree/dev/examples/vue-apollo) and [vue-apollo](https://github.com/Akryum/vue-apollo).
