<template>
  <div class="flex flex-col gap-4">
    <UCard class="p-4">
      <div class="n-header-upper">
        StarLink Example
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <UButton @click="getShips">
          Load Ships
        </UButton>

        <UButton @click="getLaunches">
          Load Launches
        </UButton>
      </div>
    </UCard>

    <UCard class="p-4">
      <div>
        Raw Output
      </div>

      <p v-if="loading">
        loading...
      </p>
      <pre v-else>{{ result }}</pre>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
// @ts-ignore
import queryLaunches from '~/queries/launches.gql'

const queryShips = gql`query ships { ships { id name } }`

const { result, restart, loading } = useQuery(queryShips)

const getShips = () => restart()

const { load, onError, refetch, result: launchResult } = useLazyQuery(queryLaunches)
watch(launchResult, v => (result.value = v))

onError(e => console.error(e))

const getLaunches = () => !launchResult.value ? load() : refetch()
</script>
