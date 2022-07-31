import type { ErrorResponse } from '@nuxtjs/apollo'

export default defineNuxtPlugin((nuxtApp) => {
  // Nuxt Apollo auth hook
  nuxtApp.hook('apollo:auth' as any, ({ client, authToken }) => {
    if (client !== 'todos') { return }

    // Pass token to the `todos` client
    authToken.value = '<secret_token>'
  })

  // Nuxt Apollo error hook
  nuxtApp.hook('apollo:error' as any, (error: ErrorResponse) => {
    console.log('Apollo Error Handler', error)
  })
})
