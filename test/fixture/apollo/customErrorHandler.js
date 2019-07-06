export default (err, { error }) => {
  console.log(err)
  error({ statusCode: 304, message: 'Server error!' })
}
