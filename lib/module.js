const {join} = require('path')
const nodeExternals = require('webpack-node-externals')

const IS_LINK_RE = /^https?:\/\//

module.exports = function (moduleOptions) {
  const isNuxtVersion2 = this.options.build.transpile

  // Fetch `apollo` option from `nuxt.config.js`
  const options = this.options.apollo || moduleOptions
  // Check network interfaces valid definition
  const {clientConfigs} = options
  const clientConfigKeys = Object.keys(clientConfigs)

  if (clientConfigKeys.length === 0) throw new Error('[Apollo module] No clientConfigs found in apollo configuration')
  if (!clientConfigs.default) throw new Error('[Apollo module] No default client configuration found in apollo configuration')

  // Sanitize clientConfigs option
  clientConfigKeys.forEach((key) => {
    const clientConfig = clientConfigs[key]

    if (typeof clientConfig !== 'object') {
      if (typeof clientConfig !== 'string' || IS_LINK_RE.test(clientConfig)) {
        throw new Error(`[Apollo module] Client configuration "${key}" should be an object or a path to an exported Apollo Client config.`)
      }
    } else if (typeof clientConfig.httpEndpoint !== 'string' || !IS_LINK_RE.test(clientConfig.httpEndpoint)) {
      if (typeof clientConfig.link !== 'object') {
        throw new Error(`[Apollo module] Client configuration "${key}" must define httpEndpoint or link option.`)
      }
    }
  })

  options.tokenName = options.tokenName || 'apollo-token'
  options.tokenExpires = options.tokenExpires || 7

  options.authenticationType = (options.authenticationType === undefined) ? 'Bearer' : options.authenticationType

  if (options.hasOwnProperty('errorHandler') && typeof options.errorHandler !== 'function') {
    throw new Error(`[Apollo module] errorHandler must be a function.`)
  }

  // Add plugin for vue-apollo
  this.addPlugin({
    options,
    src: join(__dirname, './templates/plugin.js'),
    fileName: 'apollo-module.js'
  })

  // Add vue-apollo and apollo-client in common bundle
  if (!isNuxtVersion2) {
    this.addVendor(['vue-apollo', 'js-cookie', 'cookie'])
  }

  // Add graphql loader
  this.extendBuild((config, {isServer}) => {
    config.resolve.extensions = config.resolve.extensions.concat('.graphql', '.gql')

    const gqlRules = {
      test: /\.(graphql|gql)$/,
      use: 'graphql-tag/loader',
      exclude: /(node_modules)/
    }

    if (options.includeNodeModules) {
      delete gqlRules.exclude
    }

    if (!config.module.rules.find((rule) => rule.use === 'graphql-tag/loader')) {
      config.module.rules.push(gqlRules)
    }
    if (isServer) {
      // Adding proper way of handling whitelisting with Nuxt 2
      if (isNuxtVersion2) {
        this.options.build.transpile.push(/^vue-cli-plugin-apollo/)
      } else {
        config.externals = [
          nodeExternals({
            whitelist: [/^vue-cli-plugin-apollo/]
          })
        ]
      }
    }
  })
}
