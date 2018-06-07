const path = require('path')
const nodeExternals = require('webpack-node-externals')

module.exports = function nuxtApollo(moduleOptions) {
  // Fetch `apollo` option from `nuxt.config.js`
  const options = Object.assign({}, this.options.apollo, moduleOptions)
  options.clientConfigs = options.clientConfigs || {}

  // Check network interfaces valid definition
  const clientConfigs = options.clientConfigs
  if (Object.keys(clientConfigs).length === 0) throw new Error('[Apollo module] No clientConfigs found in apollo configuration')
  if (!clientConfigs.default) throw new Error('[Apollo module] No default client configuration found in apollo configuration')

  // Sanitize clientConfigs option
  Object.keys(clientConfigs).forEach((key) => {
    if (typeof clientConfigs[key] !== 'object') {
      if (typeof clientConfigs[key] !== 'string' || (typeof clientConfigs[key] === 'string' && /^https?:\/\//.test(clientConfigs[key]))) {
        throw new Error(`[Apollo module] Client configuration "${key}" should be an object or a path to an exported Apollo Client config.`)
      }
    } else {
      if (typeof clientConfigs[key].httpEndpoint !== 'string' || (typeof clientConfigs[key].httpEndpoint === 'string' && /^https?:\/\//.test(clientConfigs[key]))) {
        if (typeof clientConfigs[key].link !== 'string' || (typeof clientConfigs[key].link === 'string' && /^https?:\/\//.test(clientConfigs[key]))) {
          throw new Error(`[Apollo module] Client configuration "${key}" must define httpEndpoint or link option.`)
        }
      }
    }
  })

  // Add plugin for vue-apollo
  this.addPlugin({
    options: options,
    src: path.join(__dirname, 'plugin.js')
  })

  // Add vue-apollo and apollo-client in common bundle
  this.addVendor(['vue-apollo', 'apollo-client', 'apollo-cache-inmemory', 'js-cookie'])
 
  // Add graphql loader
  this.extendBuild((config) => {
    config.resolve.extensions = config.resolve.extensions.concat('.graphql', '.gql')
    const gqlRules = {
      test: /\.(graphql|gql)$/,
      use: 'graphql-tag/loader',
      exclude: /(node_modules)/
    }
    if(options.includeNodeModules){
      delete gqlRules.exclude
    }
    config.module.rules.push(gqlRules)
    if (isServer) {
      config.externals = [
        nodeExternals({
          whitelist: [/^vue-cli-plugin-apollo/]
        })
      ]
    }
  })
}
