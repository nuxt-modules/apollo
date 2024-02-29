<script lang="ts" setup>
const apis = ref([
  { label: 'Starlink', value: 'starlink' },
  { label: 'Todos', value: 'todos' },
  { label: 'Github', value: 'github' }
])

const apiCookie = useCookie('apollo_api', { default: () => apis.value[0].value })
const api = ref(apiCookie.value)
watch(api, value => (apiCookie.value = value))
</script>

<template>
  <div id="wrapper">
    <main class="p-4">
      <div class="flex flex-col gap-4">
        <UCard class="p4">
          <form class="flex gap-3 items-center">
            <URadioGroup
              v-model="api"
              :options="apis"
              legend="Choose GraphQL API"
            />
          </form>
        </UCard>

        <template v-if="api === 'github'">
          <GithubDemo />
        </template>
        <template v-else-if="api === 'starlink'">
          <StarlinkDemo />
        </template>
        <template v-else-if="api === 'todos'">
          <TodosDemo />
        </template>
      </div>
    </main>

    <footer class="border-t-1 border-slate flex justify-center items-center">
      @nuxtjs/apollo playground
    </footer>
  </div>
</template>

<style scoped>
#wrapper {
  min-height: 100vh;

  display: grid;
  grid-template-rows: 1fr 60px;
}
</style>
