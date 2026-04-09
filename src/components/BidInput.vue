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

watch(
  () => props.previousBid,
  (bid) => {
    if (bid) {
      count.value = bid.count
      face.value = Math.min(bid.face + 1, 6)
      mode.value = bid.mode
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
  if (prev.mode === 'fei' && mode.value === 'zhai') return Math.ceil(prev.count / 2)
  if (prev.mode === 'zhai' && mode.value === 'fei') return prev.count * 2 + 1
  return prev.count
})

function isFaceValid(f: number): boolean {
  if (!props.previousBid) return true
  const prev = props.previousBid
  if (mode.value === prev.mode && count.value === prev.count) return f > prev.face
  return true
}

function isCountValid(c: number): boolean {
  return c >= effectiveMinCount.value && c <= props.maxCount
}

// Swipe handling for count (vertical) and face (horizontal)
let touchStartX = 0
let touchStartY = 0
let swiped = false

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  swiped = false
}

function onTouchEnd(e: TouchEvent) {
  if (swiped) return
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (absDx < 20 && absDy < 20) return // tap, not swipe

  if (absDy > absDx) {
    // Vertical swipe → change count
    swiped = true
    const delta = dy < 0 ? 1 : -1 // swipe up = increase
    const next = count.value + delta
    if (isCountValid(next)) {
      count.value = next
      fixFace()
    }
  } else {
    // Horizontal swipe → change face
    swiped = true
    const delta = dx > 0 ? 1 : -1 // swipe right = increase
    let next = face.value + delta
    if (next > 6) next = 1
    if (next < 1) next = 6
    // Find next valid face in swipe direction
    for (let i = 0; i < 6; i++) {
      if (isFaceValid(next)) { face.value = next; break }
      next += delta
      if (next > 6) next = 1
      if (next < 1) next = 6
    }
  }
}

function fixFace() {
  if (!isFaceValid(face.value)) {
    const valid = [1, 2, 3, 4, 5, 6].find((f) => isFaceValid(f))
    if (valid) face.value = valid
  }
}

function adjustCount(delta: number) {
  const next = count.value + delta
  if (isCountValid(next)) {
    count.value = next
    fixFace()
  }
}

function selectFace(f: number) {
  if (isFaceValid(f)) face.value = f
}

function toggleMode() {
  mode.value = mode.value === 'fei' ? 'zhai' : 'fei'
  if (count.value < effectiveMinCount.value) count.value = effectiveMinCount.value
  fixFace()
}

const canSubmit = computed(() => isCountValid(count.value) && isFaceValid(face.value))

const bidText = computed(() => {
  const modeText = mode.value === 'fei' ? '飞' : '斋'
  return `${count.value}个${face.value} ${modeText}`
})

function submitBid() {
  if (!canSubmit.value) return
  emit('bid', { count: count.value, face: face.value, mode: mode.value })
}
</script>

<template>
  <div
    class="bg-cn-wood/90 border-t border-cn-gold/40 px-3 py-2.5 space-y-2"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Swipe hint -->
    <p class="text-[10px] text-cn-cream/30 text-center">↕ 上下滑调数量 · ↔ 左右滑调点数</p>

    <!-- Row 1: Count | Face | Mode -->
    <div class="flex items-center gap-2">
      <!-- Count with +/- -->
      <div class="flex items-center gap-1 shrink-0">
        <button
          class="w-8 h-8 rounded-full border border-cn-gold/60 text-cn-gold text-lg
                 flex items-center justify-center active:bg-cn-gold/20
                 disabled:opacity-30"
          :disabled="!isCountValid(count - 1)"
          @click="adjustCount(-1)"
        >−</button>
        <span class="text-2xl font-bold text-cn-gold font-chinese min-w-8 text-center">
          {{ count }}
        </span>
        <button
          class="w-8 h-8 rounded-full border border-cn-gold/60 text-cn-gold text-lg
                 flex items-center justify-center active:bg-cn-gold/20
                 disabled:opacity-30"
          :disabled="!isCountValid(count + 1)"
          @click="adjustCount(1)"
        >+</button>
      </div>

      <span class="text-cn-cream/40 text-sm">个</span>

      <!-- Face selector -->
      <div class="flex gap-1 flex-1 justify-center">
        <button
          v-for="f in [1, 2, 3, 4, 5, 6]"
          :key="f"
          class="w-9 h-9 rounded-lg text-base font-bold flex items-center justify-center
                 transition-colors border"
          :class="
            !isFaceValid(f)
              ? 'bg-cn-ink/20 text-cn-cream/20 border-cn-cream/10'
              : face === f
                ? 'bg-cn-gold text-cn-ink border-cn-gold shadow-md'
                : 'bg-cn-ink/40 text-cn-cream border-cn-cream/20 active:bg-cn-ink/60'
          "
          :disabled="!isFaceValid(f)"
          @click="selectFace(f)"
        >{{ f }}</button>
      </div>

      <!-- Mode toggle -->
      <button
        class="px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border shrink-0"
        :class="
          mode === 'fei'
            ? 'bg-cn-red border-cn-red text-cn-cream'
            : 'bg-cn-gold border-cn-gold text-cn-ink'
        "
        @click="toggleMode"
      >{{ mode === 'fei' ? '飞' : '斋' }}</button>
    </div>

    <!-- Row 2: Bid + Challenge -->
    <div class="flex gap-2">
      <button
        class="flex-1 py-2.5 rounded-xl bg-cn-red border-2 border-cn-gold text-cn-gold
               font-chinese text-lg active:bg-cn-dark-red transition-colors
               disabled:opacity-40"
        :disabled="!canSubmit"
        @click="submitBid"
      >叫！{{ bidText }}</button>
      <button
        v-if="previousBid"
        class="px-6 py-2.5 rounded-xl bg-cn-gold text-cn-ink font-chinese
               text-lg font-bold active:opacity-80 transition-colors"
        @click="$emit('challenge')"
      >开！</button>
    </div>
  </div>
</template>
