# Apollo

> Nuxt.js module to use [vue-apollo](https://github.com/Akryum/vue-apollo) (integrates graphql-tag loader to parse `.gql` & `.graphql` files)

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

- clients: `Object`
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

export default createNetworkInterface({
  uri: 'https://api.graph.cool/simple/v1/cj1dqiyvqqnmj0113yuqamkuu'
})
```

## Usage

See [Official example](https://github.com/nuxt/nuxt.js/tree/dev/examples/vue-apollo) and [vue-apollo](https://github.com/Akryum/vue-apollo).
  
