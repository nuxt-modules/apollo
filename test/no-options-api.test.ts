import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

const idSegments = (html: string) => [...html.matchAll(/data-id="([^"]+)"/g)].map(m => m[1]!.split('-').length)

describe('optionsApi: false', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url)),
    nuxtConfig: {
      apollo: { optionsApi: false }
    }
  })

  it('does not install the options api provider', async () => {
    const html = await $fetch<string>('/options-api')
    expect(html).toMatch(/<p id="greeting">\s*<\/p>/)
  })

  it('keeps the composables working', async () => {
    const html = await $fetch<string>('/composition-api')
    expect(html).toMatch(/<p id="async-query">\s*Hello from GraphQL\s*<\/p>/)
    expect(html).toMatch(/<p id="use-query">\s*Hello from GraphQL\s*<\/p>/)
  })

  it('renders components synchronously', async () => {
    const segments = idSegments(await $fetch<string>('/use-id'))
    expect(segments).toHaveLength(3)
    expect(new Set(segments).size).toBe(1)
  })
})
