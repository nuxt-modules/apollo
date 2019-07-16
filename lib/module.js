const { join } = require('path')
const nodeExternals = require('webpack-node-externals')

const ALLOW_GQL_FILES = ['.graphql', '.gql']

module.exports = function (moduleOptions) {
  const isNuxtVersion2 = this.options.build.transpile
  // Fetch `apollo` option from `nuxt.config.js`
  const options = this.options.apollo || moduleOptions
  // Check network interfaces valid definition
  const { clientConfigs } = options
  const clientConfigKeys = Object.keys(clientConfigs)

  if (clientConfigKeys.length === 0) throw new Error('[Apollo module] No clientConfigs found in apollo configuration')
  if (!clientConfigs.default) throw new Error('[Apollo module] No default client configuration found in apollo configuration')

  // Sanitize clientConfigs option
  clientConfigKeys.forEach((key) => {
    const clientConfig = clientConfigs[key]

    if (typeof clientConfig !== 'object') {
      if (typeof clientConfig !== 'string') {
        throw new Error(`[Apollo module] Client configuration "${key}" should be an object or a path to an exported Apollo Client config.`)
      }
    } else if (typeof clientConfig.httpEndpoint !== 'string') {
      if (typeof clientConfig.link !== 'object') {
        throw new Error(`[Apollo module] Client configuration "${key}" must define httpEndpoint or link option.`)
      }
    }
  })

  options.tokenName = options.tokenName || 'apollo-token'
  options.cookieAttributes = options.cookieAttributes || { expires: 7, path: '/', secure: false }

  // Fallback for tokenExpires
  if (typeof options.tokenExpires === 'number') {
    console.warn('Deprecation warning: tokenExpires will no longer be supported in the next releases, use the cookieAttributes configuration instead.')
    Object.assign(options.cookieAttributes, { expires: options.tokenExpires })
  }

  options.authenticationType = options.authenticationType === undefined ? 'Bearer' : options.authenticationType

  if (options.errorHandler !== undefined && typeof options.errorHandler !== 'string') {
    throw new Error(`[Apollo module] errorHandler should be a path to an exported error handler config.`)
  }
  if (options.defaultOptions !== undefined && typeof options.defaultOptions !== 'object') {
    throw new Error(`[Apollo module] defaultOptions must be a object.`)
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
  this.extendBuild((config, { isServer }) => {
    const { resolve } = config

    const hasGqlExt = resolve.extensions.some(ext => (
      ALLOW_GQL_FILES.includes(ext)
    ))

    if (!hasGqlExt) {
      resolve.extensions = [...resolve.extensions, ...ALLOW_GQL_FILES]
    }

    const { rules } = config.module

    const hasGqlLoader = rules.some(rule => (
      rule.use === 'graphql-tag/loader'
    ))

    if (!hasGqlLoader) {
      const gqlRules = {
        test: /\.(graphql|gql)$/,
        use: 'graphql-tag/loader'
      }

      if (!options.includeNodeModules) {
        gqlRules.exclude = /(node_modules)/
      }

      rules.push(gqlRules)
    }

    if (isServer) {
      const apolloModuleRe = /^vue-cli-plugin-apollo/

      // Adding proper way of handling whitelisting with Nuxt 2
      if (isNuxtVersion2) {
        this.options.build.transpile.push(apolloModuleRe)
      } else {
        config.externals = [
          nodeExternals({
            whitelist: [apolloModuleRe]
          })
        ]
      }
    }
  })
}
