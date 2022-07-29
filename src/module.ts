import { existsSync } from 'fs'
import jiti from 'jiti'
import { useLogger, addPlugin, addAutoImport, createResolver, defineNuxtModule, addTemplate, extendWebpackConfig, extendViteConfig } from '@nuxt/kit'
import GraphQLPlugin from '@rollup/plugin-graphql'
import { name, version } from '../package.json'
import type { ClientConfig, NuxtApolloConfig } from './types'

const logger = useLogger(name)

function readConfigFile (path: string): ClientConfig {
  return jiti(import.meta.url, { interopDefault: true })(path)
}

export default defineNuxtModule<NuxtApolloConfig<any>>({
  meta: {
    name,
    version,
    configKey: 'apollo'
  },
  defaults: {
    components: true,
    autoImports: true,
    authType: 'Bearer',
    authHeader: 'Authorization',
    cookieAttributes: {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production'
    }
  },
  setup (options, nuxt) {
    if (!options.clientConfigs || !Object.keys(options.clientConfigs).length) {
      throw new Error('[@nuxtjs/apollo] Atleast one client must be configured.')
    }

    const { resolve } = createResolver(import.meta.url)
    const rootResolver = createResolver(nuxt.options.rootDir)

    nuxt.options.build.transpile = nuxt.options.build.transpile || []
    nuxt.options.build.transpile.push(
      resolve('runtime'),
      '@apollo/client',
      '@vue/apollo-composable',
      'ts-invariant/process')

    const configPaths: string[] = []

    // eslint-disable-next-line prefer-const
    for (let [k, v] of Object.entries(options.clientConfigs)) {
      if (typeof v === 'string') {
        const path = rootResolver.resolve(v)
        const resolvedConfig = existsSync(path) && readConfigFile(path)

        if (!resolvedConfig) {
          logger.warn(`Unable to resolve Apollo config for client: ${k}`)
          continue
        }

        v = resolvedConfig
        configPaths.push(path)
      }

      v.tokenName = v?.tokenName || `apollo:${k}.token`

      v.authHeader = v?.authHeader || options.authHeader

      if (typeof v?.getAuth === 'function') {
        v.getAuth = v.getAuth()
      }

      if (!v?.httpEndpoint && !v?.wsEndpoint) {
        logger.error(`Either \`httpEndpoint\` or \`wsEndpoint\` must be provided for client: \`${k}\``)
      }

      options.clientConfigs[k] = v
    }

    // @ts-ignore
    nuxt.options.runtimeConfig.public.apollo = options

    const errHandler = options.errorHandler && rootResolver.resolve(options.errorHandler)

    nuxt.options.alias['#apollo/error-handler'] = (errHandler && existsSync(errHandler))
      ? errHandler
      : addTemplate({
        filename: 'apollo-error-handler.mjs',
        getContents: () => [
          'export default (err) => {',
          // eslint-disable-next-line no-template-curly-in-string
          'if (err?.graphQLErrors) { err.graphQLErrors.map(({ message, locations, path }) => console.log(`[@nuxtjs/apollo] [GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)) }',
          // eslint-disable-next-line no-template-curly-in-string
          'if (err?.networkError) { console.log(`[@nuxtjs/apollo] [Network error]: ${err.networkError}`) }',
          '}'
        ].join('\n')
      }).dst as string

    addPlugin(resolve('runtime/plugin'))

    // TODO: Integrate @vue/apollo-components?

    addAutoImport([
      ...[
        'useApollo',
        'useAsyncQuery',
        'useLazyAsyncQuery'
      ].map(n => ({ name: n, from: resolve('runtime/composables') })),
      ...(!options?.autoImports
        ? []
        : [
            'useQuery',
            'useLazyQuery',
            'useMutation',
            'useSubscription',

            'useApolloClient',

            'useQueryLoading',
            'useMutationLoading',
            'useSubscriptionLoading',

            'useGlobalQueryLoading',
            'useGlobalMutationLoading',
            'useGlobalSubscriptionLoading'
          ].map(n => ({ name: n, from: '@vue/apollo-composable' })))
    ])

    // TODO: Support HMR for Apollo Configurations
    nuxt.hook('builder:watch', async (_event, path) => {
      if (!configPaths.some(p => p.includes(path))) { return }

      logger.log('[@nuxtjs/apollo] Reloading Apollo configuration')

      await nuxt.callHook('builder:generateApp')
    })

    extendViteConfig((config) => {
      config.plugins = config.plugins || []
      config.plugins.push(GraphQLPlugin())
    })

    extendWebpackConfig((config) => {
      // @ts-ignore
      const hasGqlLoader = config.module.rules.some((rule: any) => rule?.use === 'graphql-tag/loader')

      if (hasGqlLoader) { return }

      // @ts-ignore
      config.module.rules.push({
        test: /\.(graphql|gql)$/,
        use: 'graphql-tag/loader',
        exclude: /(node_modules)/
      })
    })
  }
})

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    // @ts-ignore
    apollo: NuxtApolloConfig<any>

    // @ts-ignore
    public:{
      apollo: NuxtApolloConfig<any>
    }
  }
}
