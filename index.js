const path = require('path')

module.exports = function nuxtApollo(moduleOptions) {
  // Fetch `apollo` option from `nuxt.config.js`
  const options = Object.assign({}, this.options.apollo, moduleOptions)
  options.networkInterfaces = options.networkInterfaces || {}

  // Check network interfaces valid definition
  const networkInterfaces = options.networkInterfaces
  if (Object.keys(networkInterfaces).length === 0) throw new Error('[Apollo module] No network interfaces found in apollo configuration')
  if (!networkInterfaces.default) throw new Error('[Apollo module] No default network interface found in apollo configuration')

  // Sanitize networkInterfaces option
  Object.keys(networkInterfaces).forEach((key) => {
    if (typeof networkInterfaces[key] !== 'string' || (typeof networkInterfaces[key] === 'string' && /^https?:\/\//.test(networkInterfaces[key]))) {
      throw new Error(`[Apollo module] Network interface "${key}" should be a path to a network interface.`)
    }
  })

  // Add plugin for vue-apollo
  this.addPlugin({
    src: path.join(__dirname, 'plugin.js'),
    options: options
  })

  // Add vue-apollo and apollo-client in common bundle
  this.addVendor(['vue-apollo', 'apollo-client'])
 
  // Add graphql loader
  this.extendBuild((config) => {
    config.resolve.extensions = config.resolve.extensions.concat('.graphql', '.gql')
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      use: 'graphql-tag/loader'
    })
  })
}
