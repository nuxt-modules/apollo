import type { ErrorResponse } from '@nuxtjs/apollo'

export default defineNuxtPlugin((nuxtApp) => {
  // Nuxt Apollo auth hook
  nuxtApp.hook('apollo:auth', ({ client, token }) => {
    if (client !== 'todos') { return }

    // Pass token to the `todos` client
    token.value = '<secret_token>'
  })

  // Nuxt Apollo error hook
  nuxtApp.hook('apollo:error', (error: ErrorResponse) => {
    console.log('Apollo Error Handler', error)
  })
})
