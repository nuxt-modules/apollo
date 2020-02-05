const { resolve } = require('path')
require('dotenv').config()

module.exports = {
  globalName: 'uniquename',
  rootDir: resolve(__dirname, '../..'),
  srcDir: __dirname,
  dev: false,
  render: {
    resourceHints: false
  },
  head: {
    title: 'Demo Page of apollo module'
  },
  modules: [['@@', {
    errorHandler: '~/apollo/customErrorHandler.js',
    clientConfigs: {
      default: {
        httpEndpoint: process.env.HTTP_ENDPOINT,
        wsEndpoint: process.env.WS_ENDPOINT
      }
    }
  }]]
}
