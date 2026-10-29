<script setup lang="ts">
const query = gql`query greeting { greeting }`
const { data } = await useAsyncQuery<{ greeting: string }>(query)
const { result } = useQuery<{ greeting: string }>(query)
</script>

<template>
  <p id="async-query">
    {{ data?.greeting }}
  </p>
  <p id="use-query">
    {{ result?.greeting }}
  </p>
</template>
