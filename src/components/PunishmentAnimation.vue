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
    class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
    @click="emit('close')"
  >
    <div class="animate-ink-splash flex flex-col items-center gap-6 px-8">
      <div class="text-5xl font-chinese text-cn-gold leading-tight text-center">
        {{ text }}
      </div>
      <div class="text-xl text-cn-red font-chinese">
        {{ loserName }}
      </div>
      <div class="text-sm text-cn-cream/40 mt-4">点击关闭</div>
    </div>
  </div>
</template>
