<template>
  <div id="wrapper" bg-light text-dark>
    <main p-4>
      <div flex flex-col gap-4>
        <NCard class="p4">
          <div class="n-header-upper">
            GraphQL API
          </div>

          <form class="flex gap-3 items-center">
            <NRadio
              v-for="entry of apis"
              :key="entry"
              v-model="api"
              :name="entry"
              :value="entry"
              n="red6 dark:red5"
            >
              {{ entry }}
            </NRadio>
          </form>
        </NCard>

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

    <footer border-t-1 border-slate flex justify-center items-center>
      @nuxtjs/apollo playground
    </footer>
  </div>
</template>

<script lang="ts" setup>
const apis = ref(['starlink', 'todos', 'github'])

const apiCookie = useCookie('apollo_api', { default: () => apis.value[0] })
const api = ref(apiCookie.value)
watch(api, value => (apiCookie.value = value))
</script>

<style scoped>
#wrapper {
  min-height: 100vh;

  display: grid;
  grid-template-rows: 1fr 60px;
}
</style>
