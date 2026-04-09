<script setup lang="ts">
defineProps<{
  text: string
  loserName: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-cn-ink/85 flex items-center justify-center cursor-pointer"
    @click="emit('close')"
  >
    <div class="animate-ink-splash flex flex-col items-center gap-6 px-8">
      <div class="punishment-title font-serif-cn leading-tight text-center font-bold text-cn-gold">
        {{ text }}
      </div>
      <div class="text-xl text-cn-red font-serif-cn font-bold">
        {{ loserName }}
      </div>
      <div class="text-sm text-cn-muted mt-4">點擊關閉</div>
    </div>
  </div>
</template>

<style scoped>
.punishment-title {
  font-size: clamp(2rem, 10vw, 3.5rem);
}
</style>
