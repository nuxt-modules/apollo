<template>
  <div class="flex flex-col gap-4">
    <UCard class="p-4">
      <div class="n-header-upper">
        Todos Example
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <UButton @click="refresh">
          Load Todos
        </UButton>

        <UButton :disabled="!subscribe" @click="createTodo">
          Create Todo
        </UButton>

        <UButton :disabled="subscribe" @click="todoAdded">
          Subscribe
        </UButton>
      </div>
    </UCard>

    <UCard class="p-4">
      <div>
        Raw Output
      </div>

      <pre v-if="data">{{ data }}</pre>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const gqlTodos = gql`query todo { todos { id text } }`
const gqlCreateTodo = gql`mutation createTodo($todo: TodoInput!) { createTodo(todo: $todo) { id } }`
const gqlTodoAdded = gql`subscription todoAdded { todoAdded { id text } }`

type TodoEntry = { id: string, text: string }
const { data, refresh } = await useAsyncQuery<TodoEntry[]>(gqlTodos, null, 'todos')

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
    // eslint-disable-next-line no-console
    console.log(e)
  })
}
</script>
