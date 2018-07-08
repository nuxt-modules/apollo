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
      default: '~/plugins/apollo-config.js'
    }
  }]]
}
