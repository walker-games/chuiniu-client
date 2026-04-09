<script setup lang="ts">
import DiceFace from './DiceFace.vue'

defineProps<{
  dice: number[]
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Transition name="dice-viewer">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex flex-col justify-end"
      @click.self="emit('close')"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/60" @click="emit('close')" />

      <!-- Sheet -->
      <div class="relative bg-cn-surface/95 backdrop-blur-xl border-t border-cn-gold/20 rounded-t-2xl px-4 py-5">
        <div class="w-10 h-1 bg-cn-gold/30 rounded-full mx-auto mb-4" />
        <p class="text-center text-cn-gold/60 text-xs mb-4 font-serif-cn tracking-wider">我的骰子</p>
        <div class="flex justify-center gap-3 pb-2">
          <div v-for="(d, i) in dice" :key="i" class="dice-glow">
            <DiceFace :value="d" />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.dice-glow {
  filter: drop-shadow(0 2px 8px rgba(212, 168, 83, 0.2));
}

.dice-viewer-enter-active,
.dice-viewer-leave-active {
  transition: all 0.3s ease;
}
.dice-viewer-enter-active .relative,
.dice-viewer-leave-active .relative {
  transition: transform 0.3s ease;
}
.dice-viewer-enter-from,
.dice-viewer-leave-to {
  opacity: 0;
}
.dice-viewer-enter-from .relative {
  transform: translateY(100%);
}
.dice-viewer-leave-to .relative {
  transform: translateY(100%);
}
</style>
