export default (apolloError, { route }) => {
  // console.log(apolloError)
  console.log('error: ' + route.path)
}
