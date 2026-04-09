<script setup lang="ts">
defineProps<{
  value: number
}>()

const CDN = 'https://images.walker-learn.xyz/chuiniu/dice'
</script>

<template>
  <img
    :src="`${CDN}/dice-${value}.png`"
    :alt="`${value}`"
    class="w-12 h-12 rounded-lg shadow-md select-none"
  />
</template>
