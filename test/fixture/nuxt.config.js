const {resolve} = require('path')
require('dotenv').config()

module.exports = {
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
    clientConfigs: {
      default: {
        httpEndpoint: process.env.HTTP_ENDPOINT,
        wsEndpoint: process.env.WS_ENDPOINT
      }
    }
  }]]
}
