<template>
  <div>
    <div>

      <em>This is the landing page.
        Please log in to get credentials to visit secret page "Page A"
      </em>
    </div>
    <div>
      <button @click="triggerBasicFunction">Basic mutation</button>
    </div>
    <div>
      <strong v-if="showMessage">Open Network panel and see if "Request Headers => authorization" are set correctly with "Bearer 1234"</strong>
    </div>
  </div>
</template>

<script>
  import authenticateUserGql from '../gql/authenticateUser.gql'

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
        showMessage: false
      }
    },
    methods: {
      async triggerBasicFunction () {
        try {
          await this.$apollo.mutate({
            mutation: authenticateUserGql,
            variables: this.credentials
          })
        } catch (e) {
          // as we dont make a valid request this will fail permanently. just check network panel is authorization header is set
          console.log(e)
        }
        this.showMessage = true
      }
    }
  }
</script>
