<script>
export default {
  apollo: {
    greeting: gql`query greeting { greeting }`
  }
}
</script>

<template>
  <p id="greeting">
    {{ greeting }}
  </p>
</template>
