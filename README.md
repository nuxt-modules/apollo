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
    clients: {
      default: 'https://api.graph.cool/simple/v1/cj1dqiyvqqnmj0113yuqamkuu'
    }
  }
}
```

## Options

- clients: `Object`
  - default: `String` or `Object` (if `Object`, should be [NetworkInterface options](http://dev.apollodata.com/core/apollo-client-api.html#NetworkInterfaceOptions))
  - [otherClient]: `String` or `Object`
  
Example (`nuxt.config.js`):
```js
module.exports = {
  modules: ['@nuxtjs/apollo'],
  apollo: {
    clients: {
      default: 'https://api.graph.cool/simple/v1/cj1dqiyvqqnmj0113yuqamkuu',
      test: {
        uri: 'https://api.graph.cool/simple/v1/cj1dqiyvqqnmj0113yuqamkuu',
        transportBatching: true
      }
    }
  }
}
```

## Usage

See [Official example](https://github.com/nuxt/nuxt.js/tree/dev/examples/vue-apollo) and [vue-apollo](https://github.com/Akryum/vue-apollo).
  
