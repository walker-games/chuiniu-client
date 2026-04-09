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

watch(() => props.previousBid, (bid) => {
  if (bid) {
    count.value = bid.count
    face.value = Math.min(bid.face + 1, 6)
    mode.value = bid.mode
    if (face.value > 6) { face.value = 1; count.value = bid.count + 1 }
  }
})

const effectiveMinCount = computed(() => {
  if (!props.previousBid) return 1
  const prev = props.previousBid
  if (prev.mode === 'fei' && mode.value === 'zhai') return Math.ceil(prev.count / 2)
  if (prev.mode === 'zhai' && mode.value === 'fei') return prev.count * 2 + 1
  return prev.count
})

function isFaceValid(f: number): boolean {
  if (!props.previousBid) return true
  if (mode.value === props.previousBid.mode && count.value === props.previousBid.count) return f > props.previousBid.face
  return true
}

function isCountValid(c: number): boolean {
  return c >= effectiveMinCount.value && c <= props.maxCount
}

function fixFace() {
  if (!isFaceValid(face.value)) {
    const valid = [1,2,3,4,5,6].find(f => isFaceValid(f))
    if (valid) face.value = valid
  }
}

function changeCount(delta: number) {
  const next = count.value + delta
  if (isCountValid(next)) { count.value = next; fixFace() }
}

function changeFace(delta: number) {
  let next = face.value + delta
  for (let i = 0; i < 6; i++) {
    if (next > 6) next = 1
    if (next < 1) next = 6
    if (isFaceValid(next)) { face.value = next; return }
    next += delta
  }
}

function toggleMode() {
  mode.value = mode.value === 'fei' ? 'zhai' : 'fei'
  if (count.value < effectiveMinCount.value) count.value = effectiveMinCount.value
  if (count.value > props.maxCount) count.value = props.maxCount
  fixFace()
}

// Touch swipe on count area
let startY = 0
function onCountTouchStart(e: TouchEvent) { startY = e.touches[0].clientY }
function onCountTouchEnd(e: TouchEvent) {
  const dy = startY - e.changedTouches[0].clientY
  if (Math.abs(dy) > 20) changeCount(dy > 0 ? 1 : -1)
}

// Touch swipe on face area
let startX = 0
function onFaceTouchStart(e: TouchEvent) { startX = e.touches[0].clientX }
function onFaceTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - startX
  if (Math.abs(dx) > 20) changeFace(dx > 0 ? 1 : -1)
}

const canSubmit = computed(() => isCountValid(count.value) && isFaceValid(face.value))
const modeText = computed(() => mode.value === 'fei' ? '飞' : '斋')
</script>

<template>
  <div class="bg-cn-wood/90 border-t border-cn-gold/40 px-4 py-3">
    <!-- Main selector: [count] 个 [face] [mode] -->
    <div class="flex items-center justify-center gap-1 mb-3">
      <!-- Count: swipe up/down -->
      <div
        class="select-none cursor-ns-resize"
        @touchstart.prevent="onCountTouchStart"
        @touchend="onCountTouchEnd"
      >
        <div class="text-[10px] text-cn-cream/30 text-center mb-0.5">↕滑动</div>
        <div class="text-5xl font-bold text-cn-gold font-chinese min-w-14 text-center
                    bg-cn-ink/40 rounded-xl px-3 py-2 border border-cn-gold/30">
          {{ count }}
        </div>
      </div>

      <span class="text-2xl text-cn-cream/60 font-chinese">个</span>

      <!-- Face: swipe left/right -->
      <div
        class="select-none cursor-ew-resize"
        @touchstart.prevent="onFaceTouchStart"
        @touchend="onFaceTouchEnd"
      >
        <div class="text-[10px] text-cn-cream/30 text-center mb-0.5">↔滑动</div>
        <div class="text-5xl font-bold font-chinese min-w-14 text-center
                    bg-cn-ink/40 rounded-xl px-3 py-2 border border-cn-gold/30"
             :class="face === 1 || face === 4 ? 'text-cn-red' : 'text-cn-cream'">
          {{ face }}
        </div>
      </div>

      <!-- Mode toggle -->
      <button
        class="ml-2 px-4 py-3 rounded-xl text-xl font-bold font-chinese transition-colors border-2"
        :class="mode === 'fei'
          ? 'bg-cn-red border-cn-red text-cn-cream'
          : 'bg-cn-gold/20 border-cn-gold text-cn-gold'"
        @click="toggleMode"
      >{{ modeText }}</button>
    </div>

    <!-- Action buttons -->
    <div class="flex gap-2">
      <button
        class="flex-1 py-3 rounded-xl bg-cn-red border-2 border-cn-gold text-cn-gold
               font-chinese text-xl active:bg-cn-dark-red transition-colors
               disabled:opacity-40"
        :disabled="!canSubmit"
        @click="$emit('bid', { count, face, mode })"
      >叫！{{ count }}个{{ face }} {{ modeText }}</button>
      <button
        v-if="previousBid"
        class="px-6 py-3 rounded-xl bg-cn-gold text-cn-ink font-chinese
               text-xl font-bold active:opacity-80 transition-colors"
        @click="$emit('challenge')"
      >开！</button>
    </div>
  </div>
</template>
