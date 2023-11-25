<script>
export default {
  apollo: {
    ships: {
      query: gql`query ships ($limit: Int = 10) { ships(limit: $limit) { id name } }`,
      variables: () => ({ limit: 3 })
    }
  }
}
</script>

<template>
  <pre>
    {{ ships }}
  </pre>
</template>
