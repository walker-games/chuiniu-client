<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Bid } from '@/types/game'

const props = defineProps<{
  minCount: number
  maxCount: number
  previousBid: Bid | null
  playerCount: number
}>()

const emit = defineEmits<{
  bid: [payload: { count: number; face: number; mode: 'fei' | 'zhai' }]
  challenge: []
}>()

const count = ref(props.previousBid ? props.previousBid.count : 1)
const face = ref(props.previousBid ? Math.min(props.previousBid.face + 1, 6) : 1)
const mode = ref<'fei' | 'zhai'>(props.previousBid?.mode ?? 'fei')

// Reset selections when previousBid changes
watch(
  () => props.previousBid,
  (bid) => {
    if (bid) {
      count.value = bid.count
      face.value = Math.min(bid.face + 1, 6)
      mode.value = bid.mode
      // If face overflows, bump count
      if (face.value > 6) {
        face.value = 1
        count.value = bid.count + 1
      }
    }
  },
)

const effectiveMinCount = computed(() => {
  if (!props.previousBid) return 1
  const prev = props.previousBid
  // Switching fei -> zhai: count can halve
  if (prev.mode === 'fei' && mode.value === 'zhai') {
    return Math.ceil(prev.count / 2)
  }
  // Switching zhai -> fei: count must be prev*2+1
  if (prev.mode === 'zhai' && mode.value === 'fei') {
    return prev.count * 2 + 1
  }
  return prev.count
})

function isFaceValid(f: number): boolean {
  if (!props.previousBid) return true
  const prev = props.previousBid
  // If same mode and same count, face must be higher
  if (mode.value === prev.mode && count.value === prev.count) {
    return f > prev.face
  }
  // If count is higher or mode changed, any face is valid
  return true
}

function isCountValid(c: number): boolean {
  return c >= effectiveMinCount.value && c <= props.maxCount
}

function adjustCount(delta: number) {
  const next = count.value + delta
  if (isCountValid(next)) {
    count.value = next
    // After changing count, reset face if current is invalid
    if (!isFaceValid(face.value)) {
      const validFace = [1, 2, 3, 4, 5, 6].find((f) => isFaceValid(f))
      if (validFace) face.value = validFace
    }
  }
}

function selectFace(f: number) {
  if (isFaceValid(f)) face.value = f
}

function toggleMode() {
  mode.value = mode.value === 'fei' ? 'zhai' : 'fei'
  // Adjust count to be valid after mode switch
  if (count.value < effectiveMinCount.value) {
    count.value = effectiveMinCount.value
  }
  // Reset face if invalid
  if (!isFaceValid(face.value)) {
    const validFace = [1, 2, 3, 4, 5, 6].find((f) => isFaceValid(f))
    if (validFace) face.value = validFace
  }
}

const canSubmit = computed(() => {
  return isCountValid(count.value) && isFaceValid(face.value)
})

const bidText = computed(() => {
  const modeText = mode.value === 'fei' ? '飞' : '斋'
  return `${count.value}个${face.value} ${modeText}`
})

function submitBid() {
  if (!canSubmit.value) return
  emit('bid', { count: count.value, face: face.value, mode: mode.value })
}

function doChallenge() {
  emit('challenge')
}
</script>

<template>
  <div class="bg-cn-wood/90 border-t border-cn-gold/40 px-3 py-2.5 space-y-2">
    <!-- Row 1: Count | Face selectors | Mode toggle -->
    <div class="flex items-center gap-2">
      <!-- Count -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          class="w-7 h-7 rounded-full border border-cn-gold/60 text-cn-gold text-sm
                 flex items-center justify-center active:bg-cn-gold/20
                 disabled:opacity-30 disabled:active:bg-transparent"
          :disabled="!isCountValid(count - 1)"
          @click="adjustCount(-1)"
        >
          -
        </button>
        <span class="text-lg font-bold text-cn-gold font-chinese min-w-6 text-center">
          {{ count }}
        </span>
        <button
          class="w-7 h-7 rounded-full border border-cn-gold/60 text-cn-gold text-sm
                 flex items-center justify-center active:bg-cn-gold/20
                 disabled:opacity-30 disabled:active:bg-transparent"
          :disabled="!isCountValid(count + 1)"
          @click="adjustCount(1)"
        >
          +
        </button>
      </div>

      <!-- Face selector -->
      <div class="flex gap-1 flex-1 justify-center">
        <button
          v-for="f in [1, 2, 3, 4, 5, 6]"
          :key="f"
          class="w-8 h-8 rounded text-sm font-bold flex items-center justify-center
                 transition-colors border"
          :class="
            !isFaceValid(f)
              ? 'bg-cn-ink/20 text-cn-cream/20 border-cn-cream/10 cursor-not-allowed'
              : face === f
                ? 'bg-cn-gold text-cn-ink border-cn-gold'
                : 'bg-cn-ink/40 text-cn-cream border-cn-cream/20 active:bg-cn-ink/60'
          "
          :disabled="!isFaceValid(f)"
          @click="selectFace(f)"
        >
          {{ f }}
        </button>
      </div>

      <!-- Mode toggle -->
      <button
        class="px-3 py-1 rounded text-xs font-bold transition-colors border shrink-0"
        :class="
          mode === 'fei'
            ? 'bg-cn-red border-cn-red text-cn-cream'
            : 'bg-cn-gold border-cn-gold text-cn-ink'
        "
        @click="toggleMode"
      >
        {{ mode === 'fei' ? '飞' : '斋' }}
      </button>
    </div>

    <!-- Row 2: Bid + Challenge buttons -->
    <div class="flex gap-2">
      <button
        class="flex-1 py-2 rounded-lg bg-cn-red border border-cn-gold text-cn-gold
               font-chinese text-base active:bg-cn-dark-red transition-colors
               disabled:opacity-40 disabled:active:bg-cn-red"
        :disabled="!canSubmit"
        @click="submitBid"
      >
        叫！{{ bidText }}
      </button>
      <button
        v-if="previousBid"
        class="px-5 py-2 rounded-lg bg-cn-gold text-cn-ink font-chinese
               text-base font-bold active:bg-cn-gold-dim transition-colors"
        @click="doChallenge"
      >
        开！
      </button>
    </div>
  </div>
</template>
