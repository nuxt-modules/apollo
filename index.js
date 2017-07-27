const path = require('path')

module.exports = function nuxtApollo(moduleOptions) {
  const options = Object.assign({}, this.options.apollo, moduleOptions)
  options.clients = options.clients || {}

  const clients = options.clients
  if (Object.keys(clients).length === 0) throw new Error('No clients found in apollo configuration')
  if (!clients.default) throw new Error('No default client found in apollo configuration')

  // Sanitize clients option
  Object.keys(clients).forEach((key) => {
    if (typeof clients[key] === 'string') {
      clients[key] = { uri: clients[key] }
    }
  })

  // Add plugin for vue-apollo
  this.addPlugin({
    src: path.join(__dirname, 'plugin.js'),
    options: options
  })

  // Add vue-apollo and apollo-client in vendor
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
