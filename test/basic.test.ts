import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

const idSegments = (html: string) => [...html.matchAll(/data-id="([^"]+)"/g)].map(m => m[1]!.split('-').length)

describe('options api', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/basic', import.meta.url))
  })

  it('runs smart queries during SSR', async () => {
    const html = await $fetch<string>('/options-api')
    expect(html).toMatch(/<p id="greeting">\s*Hello from GraphQL\s*<\/p>/)
  })

  it('renders every component as an async boundary', async () => {
    const [outer, middle, inner] = idSegments(await $fetch<string>('/use-id'))
    expect(middle).toBeGreaterThan(outer!)
    expect(inner).toBeGreaterThan(middle!)
  })
})
