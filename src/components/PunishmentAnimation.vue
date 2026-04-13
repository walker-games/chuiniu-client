<script setup lang="ts">
import { ref, onMounted } from 'vue'

defineProps<{
  text: string
  loserName: string
}>()

const emit = defineEmits<{
  close: []
}>()

const shaking = ref(false)

onMounted(() => {
  shaking.value = true
  setTimeout(() => { shaking.value = false }, 500)
})
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-cn-ink/85 flex items-center justify-center cursor-pointer"
    :class="{ 'animate-shake-screen': shaking }"
    @click="emit('close')"
  >
    <div class="animate-stamp-slam flex flex-col items-center gap-4 px-8">
      <!-- Red stamp circle border -->
      <div class="stamp-ring rounded-full p-6 border-4 border-cn-red">
        <div class="punishment-title font-serif-cn leading-tight text-center font-bold text-cn-red">
          {{ text }}
        </div>
      </div>
      <div class="text-2xl text-cn-gold font-serif-cn font-bold mt-2">
        {{ loserName }}
      </div>
      <div class="text-sm text-cn-muted mt-4">點擊關閉</div>
    </div>
  </div>
</template>

<style scoped>
.punishment-title {
  font-size: clamp(2rem, 10vw, 3.5rem);
  text-shadow:
    0 0 20px oklch(48% 0.2 25 / 0.4),
    0 0 40px oklch(48% 0.2 25 / 0.2);
}

.stamp-ring {
  box-shadow:
    0 0 30px oklch(48% 0.2 25 / 0.3),
    inset 0 0 20px oklch(48% 0.2 25 / 0.1);
}
</style>
