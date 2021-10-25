const { Nuxt, Builder } = require('nuxt-edge')
const request = require('request-promise-native')

const config = require('./fixture/nuxt.config')

const url = path => `http://localhost:3000${path}`
const get = path => request(url(path))

describe('basic', () => {
  let nuxt

  beforeAll(async () => {
    nuxt = new Nuxt(config)
    await new Builder(nuxt).build()
    await nuxt.listen(3000)
  }, 60000)

  afterAll(async () => {
    await nuxt.close()
  })

  test('render', async () => {
    const html = await get('/')
    expect(html).toContain('This is the landing page')
  })

  test('normalQuery', async () => {
    const html = await get('/normalQuery')
    expect(html).toContain('Pilot')
  })

  test('asyncData', async () => {
    const html = await get('/asyncData')
    expect(html).toContain('Pilot')
  })

  test('mounted & smart query', async () => {
    const window = await nuxt.renderAndGetWindow(url('/mounted'))
    window.onNuxtReady(() => {
      const html = window.document.body.innerHTML
      expect(html).toContain('cjw1jhoxi1f4g0112ayaq3pyz')
    })
  })

  test('onLogin', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const token = 'this-is-the-token'
    window.$nuxt.$apolloHelpers.onLogin(token)
    expect(window.$nuxt.$apolloHelpers.getToken()).toContain(token)
  })

  test('onLogout', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const token = 'this-is-the-token'
    window.$nuxt.$apolloHelpers.onLogin(token)
    window.$nuxt.$apolloHelpers.onLogout()
    expect(window.$nuxt.$apolloHelpers.getToken()).toBeUndefined()
  })

  test('repeat onLogin onLogout', async () => {
    const window = await nuxt.renderAndGetWindow(url('/'))
    const token = 'this-is-the-token'
    window.$nuxt.$apolloHelpers.onLogin(token)
    window.$nuxt.$apolloHelpers.onLogout()
    window.$nuxt.$apolloHelpers.onLogin(token)
    expect(window.$nuxt.$apolloHelpers.getToken()).toContain(token)
  })

  // test('errorHandler', async () => {
  //   const window = await nuxt.renderAndGetWindow(url('/errorPage'))
  //   window.onNuxtReady(() => {
  //     expect(window.console.log).toContain('error: /errorPage')
  //   })
  // })
})
