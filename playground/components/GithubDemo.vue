<template>
  <div class="flex flex-col gap-4">
    <UCard class="p-4">
      <div class="n-header-upper">
        Github Example
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <UInput
          v-model="githubToken"
          icon="carbon-logo-github"
          placeholder="Your Github Token"
        />

        <UButton @click="setToken">
          Set Token
        </UButton>

        <UButton @click="clearToken">
          Clear Token
        </UButton>
      </div>

      <div class="mt-4 flex flex-wrap gap-3 items-center">
        <UButton :disabled="!githubToken" @click="getViewer">
          Load @me
        </UButton>

        <UButton :disabled="!githubToken" @click="getNuxtDiscussions">
          Load Nuxt Discussions
        </UButton>
      </div>
    </UCard>

    <UCard class="p-4">
      <div>
        Raw Output
      </div>

      <pre class="w-100">
        {{ JSON.stringify(output, null, 2) }}
      </pre>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import type { ViewerT, DiscussionT } from '~/types'
import discussions from '~/queries/discussions.gql'
import { NuxtApollo } from '#apollo'

const { getToken, onLogin, onLogout } = useApollo()

const githubToken = useState<string | null | undefined>()

// for testing with cookie `tokenStorage`
if (import.meta.server && NuxtApollo.clients?.github?.tokenStorage === 'cookie') {
  githubToken.value = await getToken('github')
} else if (import.meta.client) {
  onMounted(async () => {
    githubToken.value = await getToken('github')
  })
}

const queryViewer = gql`query viwer { viewer { login } }`

const output = ref()

const whoAmI = await useAsyncQuery({ query: queryViewer, clientId: 'github' }, {
  immediate: !!githubToken.value
})

watch(whoAmI.data, (data) => {
  if (!data) { return }

  output.value = data
}, { immediate: true })

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
const clearToken = () => onLogout('github', true).then(() => (githubToken.value = null))
</script>
