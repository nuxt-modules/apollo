<template>
  <div>
    <div>

      <em>This is the landing page.
        Please log in to get credentials to visit secret page "Page A"
      </em>
    </div>
    <strong>Current token:</strong>{{token}}
  </div>
</template>

<script>
  export default {
    head () {
      return {
        title: 'Startpage'
      }
    },
    data () {
      return {
        token: null,
        submitting: false,
        error: null,
        credentials: {
          email: '',
          password: ''
        },
        successfulData: null
      }
    },
    mounted () {
      this.token = this.$apolloHelpers.getToken()
    }
  }
</script>
