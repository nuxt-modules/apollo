import type { ErrorResponse } from '@nuxtjs/apollo'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('apollo:error' as any, (error: ErrorResponse) => {
    console.log('Apollo Error Handler', error)
  })
})
