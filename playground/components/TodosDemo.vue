<template>
  <div flex flex-col gap-4>
    <NCard p-4>
      <div class="n-header-upper">
        Todos Example
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <NButton @click="refresh">
          Load Todos
        </NButton>

        <NButton :disabled="!subscribe" @click="createTodo">
          Create Todo
        </NButton>

        <NButton :disabled="subscribe" @click="todoAdded">
          Subscribe
        </NButton>
      </div>
    </NCard>

    <NCard p-4>
      <div class="n-header-upper">
        Raw Output
      </div>

      <pre v-if="data">{{ data }}</pre>
    </NCard>
  </div>
</template>

<script lang="ts" setup>
const gqlTodos = gql`query todo { todos { id text } }`
const gqlCreateTodo = gql`mutation createTodo($todo: TodoInput!) { createTodo(todo: $todo) { id } }`
const gqlTodoAdded = gql`subscription todoAdded { todoAdded { id text } }`

const { data, refresh } = await useAsyncQuery(gqlTodos, 'todos')

const { mutate: todoMutation } = useMutation(gqlCreateTodo, { clientId: 'todos' })

function createTodo () {
  todoMutation({
    todo: {
      text: 'Random ' + Math.floor(Math.random() * 100)
    }
  })
}

const subscribe = ref(false)

function todoAdded () {
  subscribe.value = true

  const { onResult, onError } = useSubscription(gqlTodoAdded, null, { clientId: 'todos' })

  onResult((r) => {
    data.value = r.data as any
  })

  onError((e) => {
    console.log(e)
  })
}
</script>
