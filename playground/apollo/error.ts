import { defineApolloErrorHandler } from '../../dist/runtime'

export default defineApolloErrorHandler((err) => {
  console.log('🟥 Global error handler')
  console.log(err)
})
