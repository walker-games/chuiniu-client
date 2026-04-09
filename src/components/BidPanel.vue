<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  canChallenge: boolean
  minCount?: number
  minFace?: number
}>()

const emit = defineEmits<{
  bid: [payload: { count: number; face: number; mode: 'fei' | 'zhai' }]
  challenge: []
}>()

const count = ref(props.minCount ?? 1)
const face = ref(props.minFace ?? 1)
const mode = ref<'fei' | 'zhai'>('fei')

const faces = [1, 2, 3, 4, 5, 6]

const bidText = computed(() => {
  const modeText = mode.value === 'fei' ? '飞' : '斋'
  return `${count.value}个${face.value} ${modeText}`
})

function adjustCount(delta: number) {
  const next = count.value + delta
  if (next >= 1 && next <= 30) count.value = next
}

function selectFace(f: number) {
  face.value = f
}

function submitBid() {
  emit('bid', { count: count.value, face: face.value, mode: mode.value })
}

function doChallenge() {
  emit('challenge')
}
</script>

<template>
  <div
    class="rounded-xl border-2 border-cn-gold bg-cn-wood/80 p-4 space-y-3"
  >
    <!-- Count selector -->
    <div class="flex items-center justify-center gap-4">
      <button
        class="w-9 h-9 rounded-full border border-cn-gold text-cn-gold text-lg
               flex items-center justify-center active:bg-cn-gold/20"
        @click="adjustCount(-1)"
      >
        -
      </button>
      <span class="text-2xl font-bold text-cn-gold font-chinese min-w-8 text-center">
        {{ count }}
      </span>
      <button
        class="w-9 h-9 rounded-full border border-cn-gold text-cn-gold text-lg
               flex items-center justify-center active:bg-cn-gold/20"
        @click="adjustCount(1)"
      >
        +
      </button>
    </div>

    <!-- Face selector -->
    <div class="flex justify-center gap-2">
      <button
        v-for="f in faces"
        :key="f"
        class="w-10 h-10 rounded-lg text-lg font-bold flex items-center justify-center
               transition-colors border"
        :class="face === f
          ? 'bg-cn-gold text-cn-ink border-cn-gold'
          : 'bg-cn-ink/40 text-cn-cream border-cn-cream/20 active:bg-cn-ink/60'"
        @click="selectFace(f)"
      >
        {{ f }}
      </button>
    </div>

    <!-- Mode toggle -->
    <div class="flex justify-center gap-3">
      <button
        class="px-5 py-1.5 rounded-lg text-sm font-bold transition-colors border"
        :class="mode === 'fei'
          ? 'bg-cn-red border-cn-red text-cn-cream'
          : 'bg-transparent border-cn-cream/30 text-cn-cream/50'"
        @click="mode = 'fei'"
      >
        飞
      </button>
      <button
        class="px-5 py-1.5 rounded-lg text-sm font-bold transition-colors border"
        :class="mode === 'zhai'
          ? 'bg-cn-gold border-cn-gold text-cn-ink'
          : 'bg-transparent border-cn-cream/30 text-cn-cream/50'"
        @click="mode = 'zhai'"
      >
        斋
      </button>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-3 justify-center">
      <button
        class="flex-1 py-2.5 rounded-lg bg-cn-red border border-cn-gold text-cn-gold
               font-chinese text-lg active:bg-cn-dark-red transition-colors"
        @click="submitBid"
      >
        {{ bidText }}
      </button>
      <button
        v-if="canChallenge"
        class="px-6 py-2.5 rounded-lg bg-cn-gold text-cn-ink font-chinese
               text-lg font-bold active:bg-cn-gold-dim transition-colors"
        @click="doChallenge"
      >
        开！
      </button>
    </div>
  </div>
</template>
