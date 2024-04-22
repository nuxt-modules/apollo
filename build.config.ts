import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  entries: ['src/module', 'src/config'],
  externals: ['@nuxtjs/apollo'],
})
