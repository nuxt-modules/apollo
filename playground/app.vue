<template>
  <div>
    Nuxt module playground!

    <button @click="refresh()">
      refresh viewer
    </button>

    <button @click="getLaunches">
      getLaunches
    </button>

    <p v-if="pending">
      pending
    </p>
    <p v-if="error">
      {{ error }}
    </p>
    <pre v-if="!pending && data">
      {{ data }}
    </pre>
  </div>
</template>

<script lang="ts" setup>
import { gql } from 'graphql-tag'
import { useQuery } from '@vue/apollo-composable'
import type { LaunchesT, ViewerT } from './types'
// @ts-ignore
import LaunchesQuery from '~/queries/launches.gql'

const queryViewer = gql`query viwer { viewer { login } }`

const { data, refresh, pending, error } = await useAsyncQuery<ViewerT>(queryViewer, 'github')

function getLaunches () {
  const { onResult } = useQuery<LaunchesT[]>(LaunchesQuery)

  onResult((r) => {
    data.value = r.data as any
  })
}
</script>
