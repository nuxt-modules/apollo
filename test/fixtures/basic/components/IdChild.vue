<script setup lang="ts">
const id = useId()
</script>

<template>
  <div :data-id="id">
    <slot />
  </div>
</template>
