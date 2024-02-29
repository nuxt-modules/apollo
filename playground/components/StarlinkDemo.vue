<template>
  <div class="flex flex-col gap-4">
    <UCard class="p-4">
      <div class="n-header-upper">
        StarLink Example
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <UButton @click="refresh">
          Load Ships
        </UButton>

        <UButton @click="getLaunches">
          Load Launches
        </UButton>
      </div>
    </UCard>

    <UCard class="p-4">
      <div class="mb-4">
        <label for="limit" class="mr-2">Limit:</label>
        <input v-model.number="limit" class="w-10" type="number" min="1">
      </div>

      <div>
        Raw Output
      </div>

      <p v-if="pending">
        loading...
      </p>
      <pre v-else>{{ data }}</pre>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
// @ts-ignore
import queryLaunches from '~/queries/launches.gql'

const queryShips = gql`
  query ships($limit: Int! = 2) {
    ships(limit: $limit) {
      id
      name
    }
  }
`

const limit = ref(2)

const { data, refresh, pending } = await useAsyncQuery(queryShips, { limit })

const { load, onError, refetch, result: launchResult } = useLazyQuery(queryLaunches, undefined, {
  fetchPolicy: 'no-cache'
})
watch(launchResult, v => (data.value = v))
// eslint-disable-next-line no-console
onError(e => console.error(e))

const getLaunches = () => !launchResult.value ? load() : refetch()
</script>
