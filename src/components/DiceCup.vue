<script setup lang="ts">
import { ref } from 'vue'
import DiceFace from './DiceFace.vue'

const props = defineProps<{
  dice: number[]
  rolled: boolean
}>()

const emit = defineEmits<{
  roll: []
}>()

const shaking = ref(false)

function handleRoll() {
  if (props.rolled || shaking.value) return
  shaking.value = true
  emit('roll')
  setTimeout(() => { shaking.value = false }, 800)
}
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <!-- Cup button -->
    <button
      class="w-28 h-28 rounded-full border-3 border-cn-gold bg-cn-dark-red
             flex items-center justify-center text-cn-gold font-chinese text-3xl
             shadow-lg active:scale-95 transition-transform"
      :class="{ 'animate-shake-cup': shaking, 'opacity-60': rolled }"
      :disabled="rolled"
      @click="handleRoll"
    >
      {{ rolled ? '已摇' : '摇' }}
    </button>

    <!-- Dice display after rolling -->
    <div v-if="rolled && dice.length" class="flex gap-2 justify-center">
      <DiceFace v-for="(d, i) in dice" :key="i" :value="d" />
    </div>
  </div>
</template>
