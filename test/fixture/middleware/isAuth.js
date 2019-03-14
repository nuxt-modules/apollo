export default function ({ app, error }) {
  const hasToken = !!app.$apolloHelpers.getToken()
  if (!hasToken) {
    error({ errorCode: 403, message: 'You are not allowed to see this' })
  }
}
