<template>
  <div flex flex-col gap-4>
    <NCard p-4>
      <div class="n-header-upper">
        Github Example
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <NTextInput
          v-model="input"
          icon="carbon-logo-github"
          placeholder="Your Github Token"
        />

        <NButton @click="setToken">
          Set Token
        </NButton>

        <NButton @click="clearToken">
          Clear Token
        </NButton>
      </div>

      <div class="mt-4 flex flex-wrap gap-3 items-center">
        <NButton :disabled="!githubToken" @click="getViewer">
          Load @me
        </NButton>

        <NButton :disabled="!githubToken" @click="getNuxtDiscussions">
          Load Nuxt Discussions
        </NButton>
      </div>
    </NCard>

    <NCard p-4>
      <div class="n-header-upper">
        Raw Output
      </div>

      <pre w-100>
        {{ JSON.stringify(data, null, 2) }}
      </pre>
    </NCard>
  </div>
</template>

<script lang="ts" setup>
import gql from 'graphql-tag'
import type { ViewerT, DiscussionT } from '~/types'
// @ts-ignore
import discussions from '~/queries/discussions.gql'

const { getToken, onLogin, onLogout } = useApollo()

const input = ref(null)
const githubToken = ref(null)

const token = computed(() => getToken(null, 'github'))

if (token.value) { input.value = token.value }

const queryViewer = gql`query viwer { viewer { login } }`

const data = ref()

if (token.value) {
  const whoAmI = await useAsyncQuery({ query: queryViewer, clientId: 'github' })

  if (whoAmI?.data.value) {
    data.value = whoAmI.data.value
  }
}

const getViewer = () => {
  const { onResult, onError } = useQuery<ViewerT>(queryViewer, null, { clientId: 'github', fetchPolicy: 'cache-and-network' })

  onResult(r => (data.value = r.data.viewer))
  onError(err => console.error(err))
}

const getNuxtDiscussions = () => {
  const { onResult, onError } = useQuery<DiscussionT>(discussions, null, { clientId: 'github', fetchPolicy: 'cache-and-network' })

  onResult(r => (data.value = r.data.repository.discussions.nodes))
  onError(err => console.error(err))
}

const setToken = () => {
  githubToken.value = input.value
  onLogin(input.value, 'github')
}
const clearToken = () => onLogout('github').then(() => {
  input.value = null
  githubToken.value = null
})

</script>
