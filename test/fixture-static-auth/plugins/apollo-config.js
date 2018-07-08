export default function (ctx) {
  return {
    httpEndpoint: process.env.HTTP_ENDPOINT,
    wsEndpoint: process.env.WS_ENDPOINT,
    getAuth: () => 'Bearer 1234'
  }
}
