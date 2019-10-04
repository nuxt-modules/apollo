<template>
  <div>
    <pre>{{ connected }}</pre>
    <button @click="handleSetConnected">Set connected to true</button>
  </div>
</template>

<script>
  import gql from 'graphql-tag'

  export default {
    head () {
      return {
        title: 'Local state'
      }
    },
    data () {
      return {
        connected: null
      }
    },
    apollo: {
      connected: {
        query: gql`query isConnected {
          connected @client
        }`
      }
    },
    methods: {
      handleSetConnected () {
        this.$apollo.mutate({
          mutation: gql`mutation setConnected ($value: Boolean!) {
            connectedSet (value: $value) @client
          }`,
          variables: {
            value: true
          }
        })
      }
    }
  }
</script>
