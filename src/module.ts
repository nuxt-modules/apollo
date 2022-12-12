import { existsSync } from 'fs'
import jiti from 'jiti'
import { Ref } from 'vue'
import { defu } from 'defu'
import { useLogger, addPlugin, addImports, addTemplate, createResolver, defineNuxtModule } from '@nuxt/kit'
import GraphQLPlugin from '@rollup/plugin-graphql'
import { name, version } from '../package.json'
import type { ClientConfig, NuxtApolloConfig, ErrorResponse } from './types'

export type { ClientConfig, ErrorResponse }

const logger = useLogger(name)

async function readConfigFile (path: string): Promise<ClientConfig> {
  return await jiti(import.meta.url, { interopDefault: true, requireCache: false })(path)
}

export type ModuleOptions = NuxtApolloConfig

export default defineNuxtModule<NuxtApolloConfig<any>>({
  meta: {
    name,
    version,
    configKey: 'apollo',
    compatibility: {
      nuxt: '^3.0.0-rc.9'
    }
  },
  defaults: {
    autoImports: true,
    authType: 'Bearer',
    authHeader: 'Authorization',
    tokenStorage: 'cookie',
    proxyCookies: true,
    cookieAttributes: {
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === 'production'
    },
    clientAwareness: false
  },
  async setup (options, nuxt) {
    if (!options.clients || !Object.keys(options.clients).length) {
      throw new Error('[@nuxtjs/apollo] Atleast one client must be configured.')
    }

    const { resolve } = createResolver(import.meta.url)
    const rootResolver = createResolver(nuxt.options.rootDir)

    nuxt.options.build.transpile = nuxt.options.build.transpile || []
    nuxt.options.build.transpile.push(
      resolve('runtime'),
      '@wry/context',
      '@apollo/client',
      '@vue/apollo-composable',
      'ts-invariant/process')

    const clients: Record<string, ClientConfig> = {}
    const configPaths: Record<string, string> = {}

    async function prepareClients () {
      // eslint-disable-next-line prefer-const
      for (let [k, v] of Object.entries(options.clients)) {
        if (typeof v === 'string') {
          const path = rootResolver.resolve(v)
          const resolvedConfig = existsSync(path) && await readConfigFile(path)

          if (!resolvedConfig) {
            logger.warn(`Unable to resolve Apollo config for client: ${k}`)
            continue
          }

          v = resolvedConfig
          if (!configPaths[k]) { configPaths[k] = path }
        }

        v.authType = v?.authType || (v?.authType === '' || v?.authType === null) ? null : options.authType
        v.authHeader = v?.authHeader || options.authHeader
        v.tokenName = v?.tokenName || `apollo:${k}.token`
        v.tokenStorage = v?.tokenStorage || options.tokenStorage
        if (v.cookieAttributes) { v.cookieAttributes = defu(v?.cookieAttributes, options.cookieAttributes) }

        v.defaultOptions = v?.defaultOptions || options.defaultOptions

        if (!v?.httpEndpoint && !v?.wsEndpoint) {
          logger.error(`Either \`httpEndpoint\` or \`wsEndpoint\` must be provided for client: \`${k}\``)
        }

        clients[k] = v
      }
    }

    addTemplate({
      filename: 'apollo.d.ts',
      getContents: () => [
        'import type { ClientConfig } from "@nuxtjs/apollo"',
        'declare const clients: Record<string, ClientConfig>',
        'declare const clientAwareness: boolean',
        'declare const proxyCookies: boolean',
        'declare const cookieAttributes: ClientConfig[\'cookieAttributes\']',
        'export default { clients, clientAwareness, proxyCookies, cookieAttributes }'
      ].join('\n')
    })

    nuxt.options.alias['#apollo'] = addTemplate({
      filename: 'apollo.mjs',
      getContents: () => [
        'export default {',
        ` proxyCookies: ${options.proxyCookies},`,
        ` clientAwareness: ${options.clientAwareness},`,
        ` cookieAttributes: ${JSON.stringify(options.cookieAttributes)},`,
        ` clients: ${JSON.stringify(clients)}`,
        '}'
      ].join('\n')
    }).dst

    nuxt.options.alias['apollo-upload-client'] = 'apollo-upload-client/public/index.mjs'

    addPlugin(resolve('runtime/plugin'))

    // TODO: Integrate @vue/apollo-components?

    addImports([
      { name: 'gql', from: 'graphql-tag' },
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

    nuxt.hook('vite:extendConfig', (config) => {
      config.optimizeDeps = config.optimizeDeps || {}
      config.optimizeDeps.exclude = config.optimizeDeps.exclude || []
      config.optimizeDeps.exclude.push('@vue/apollo-composable')

      config.plugins = config.plugins || []
      // @ts-ignore
      config.plugins.push(GraphQLPlugin())

      if (!nuxt.options.dev) { config.define = { ...config.define, __DEV__: false } }
    })

    nuxt.hook('webpack:config', (configs) => {
      for (const config of configs) {
        // @ts-ignore
        const hasGqlLoader = config.module.rules.some((rule: any) => rule?.use === 'graphql-tag/loader')

        if (hasGqlLoader) { return }

        // @ts-ignore
        config.module.rules.push({
          test: /\.(graphql|gql)$/,
          use: 'graphql-tag/loader',
          exclude: /(node_modules)/
        })
      }
    })

    nuxt.hook('builder:watch', async (_event, path) => {
      if (!Object.values(configPaths).some(p => p.includes(path))) { return }

      logger.log('[@nuxtjs/apollo] Reloading Apollo configuration')

      await prepareClients()

      await nuxt.callHook('builder:generateApp')
    })

    await prepareClients()
  }
})

export const defineApolloClient = (config: ClientConfig) => config

declare module '#app' {
  interface RuntimeConfig {
    // @ts-ignore
    apollo: NuxtApolloConfig<any>

    // @ts-ignore
    public:{
      apollo: NuxtApolloConfig<any>
    }
  }

  interface RuntimeNuxtHooks {
    'apollo:auth': (params: { client: string, token: Ref<string> }) => void
    'apollo:error': (error: ErrorResponse) => void
  }
}
