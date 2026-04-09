<script setup lang="ts">
defineProps<{
  value: number
}>()

const faces = ['', '\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685']
</script>

<template>
  <div
    class="w-10 h-10 rounded-lg bg-cn-cream flex items-center justify-center
           text-2xl shadow-md select-none"
    :class="value === 1 || value === 4 ? 'text-cn-red' : 'text-cn-ink'"
  >
    {{ faces[value] || '?' }}
  </div>
</template>
