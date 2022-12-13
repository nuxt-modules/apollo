<template>
  <div flex flex-col gap-4>
    <NCard p-4>
      <div class="n-header-upper">
        Github Example
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <NTextInput
          v-model="githubToken"
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
        {{ JSON.stringify(output, null, 2) }}
      </pre>
    </NCard>
  </div>
</template>

<script lang="ts" setup>
import type { ViewerT, DiscussionT } from '~/types'
import discussions from '~/queries/discussions.gql'

const { getToken, onLogin, onLogout } = useApollo()

const githubToken = ref<string | null>(null)

// for testing with cookie `tokenStorage`
if (process.server) { githubToken.value = await getToken('github') }

onMounted(async () => {
  githubToken.value = await getToken('github')
})

const queryViewer = gql`query viwer { viewer { login } }`

const output = ref()

if (githubToken.value) {
  const whoAmI = await useAsyncQuery({ query: queryViewer, clientId: 'github' })

  if (whoAmI?.data.value) {
    output.value = whoAmI.data.value
  }
}

const getViewer = () => {
  const { onResult, onError } = useQuery<ViewerT>(queryViewer, null, { clientId: 'github', fetchPolicy: 'cache-and-network' })

  onResult(r => (output.value = r.data.viewer))
  onError(err => (output.value = err))
}

const getNuxtDiscussions = () => {
  const { onResult, onError } = useQuery<DiscussionT>(discussions, null, { clientId: 'github', fetchPolicy: 'cache-and-network' })

  onResult(r => (output.value = r.data.repository?.discussions?.nodes))
  onError(err => (output.value = err))
}

const setToken = () => {
  if (!githubToken.value) { return }

  onLogin(githubToken.value, 'github')
}
const clearToken = () => onLogout('github').then(() => (githubToken.value = null))

</script>
