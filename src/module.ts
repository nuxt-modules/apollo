import { existsSync } from 'fs'
import { useLogger, addPlugin, addAutoImport, createResolver, addAutoImportDir, defineNuxtModule, addTemplate, extendWebpackConfig, extendViteConfig } from '@nuxt/kit'
import GraphQLPlugin from '@rollup/plugin-graphql'
import { name, version } from '../package.json'
import type { ClientConfig, ModuleOptions } from './runtime/types'

const logger = useLogger(name)

async function readConfigFile (path: string): Promise<ClientConfig | undefined> {
  try {
    return (await import(path))?.default
  } catch {}
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'apollo'
  },
  defaults: {
    components: true,
    autoImports: true,
    tokenName: 'apollo-token',
    authenticationType: 'Bearer',
    cookieAttributes: {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production'
    }
  },
  async setup (options, nuxt) {
    if (!options.clientConfigs || !Object.keys(options.clientConfigs).length) {
      throw new Error('[@nuxtjs/apollo] Atleast one client must be configured.')
    }

    const { resolve } = createResolver(import.meta.url)
    const rootResolver = createResolver(nuxt.options.rootDir)

    nuxt.options.build.transpile = nuxt.options.build.transpile || []
    nuxt.options.build.transpile.push(
      '@apollo/client',
      '@vue/apollo-option',
      '@vue/apollo-composable',
      'ts-invariant/process',
      resolve('runtime'))

    const configPaths: string[] = []

    // eslint-disable-next-line prefer-const
    for (let [k, v] of Object.entries(options.clientConfigs)) {
      if (typeof v === 'string') {
        const path = rootResolver.resolve(v)
        const resolvedConfig = existsSync(path) && await readConfigFile(path)

        if (!resolvedConfig) {
          logger.warn(`Unable to resolve Apollo config for client: ${k}`)
          continue
        }

        v = resolvedConfig
        configPaths.push(path)
      }

      v.tokenName = v?.tokenName || options.tokenName

      if (typeof v?.getAuth === 'function') {
        v.getAuth = v.getAuth()
      }

      if (!v?.httpEndpoint && !v?.wsEndpoint) {
        logger.error(`Either \`httpEndpoint\` or \`wsEndpoint\` must be provided for client: \`${k}\``)
      }

      options.clientConfigs[k] = v
    }

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

    // @ts-ignore
    nuxt.options.runtimeConfig.public.apollo = options

    addPlugin(resolve('runtime/plugin'))

    // TODO: Integrate @vue/apollo-components?

    addAutoImport([
      ...['useAsyncQuery', 'useLazyAsyncQuery'].map(n => ({ name: n, from: resolve('runtime/composables') })),
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

    // TODO: Test WebPack
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

export * from './runtime/define'

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    // @ts-ignore
    apollo: ModuleOptions

    // @ts-ignore
    public:{
      apollo: ModuleOptions
    }
  }
}
