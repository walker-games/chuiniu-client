<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Picker, Button, type PickerOption } from 'vant'
import 'vant/es/picker/style'
import 'vant/es/button/style'
import type { Bid } from '@/types/game'

const props = defineProps<{
  minCount: number
  maxCount: number
  previousBid: Bid | null
  playerCount: number
}>()

defineEmits<{
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

const countOptions = computed<PickerOption[]>(() => {
  const opts: PickerOption[] = []
  for (let i = effectiveMinCount.value; i <= props.maxCount; i++) {
    opts.push({ text: `${i}`, value: i })
  }
  return opts
})

const faceOptions: PickerOption[] = [
  { text: '1', value: 1 },
  { text: '2', value: 2 },
  { text: '3', value: 3 },
  { text: '4', value: 4 },
  { text: '5', value: 5 },
  { text: '6', value: 6 },
]

const modeOptions: PickerOption[] = [
  { text: '飛', value: 'fei' },
  { text: '齋', value: 'zhai' },
]

const columns = computed(() => [countOptions.value, faceOptions, modeOptions])

const selectedValues = ref([count.value, face.value, mode.value])

watch([count, face, mode], () => {
  selectedValues.value = [count.value, face.value, mode.value]
})

function onChange({ selectedValues: vals }: { selectedValues: (string | number)[] }) {
  count.value = Number(vals[0]) || 1
  face.value = Number(vals[1]) || 1
  mode.value = vals[2] as 'fei' | 'zhai'
}

function isBidValid() {
  if (!props.previousBid) return true
  const prev = props.previousBid
  if (mode.value === prev.mode) {
    if (count.value > prev.count) return true
    if (count.value === prev.count && face.value > prev.face) return true
    return false
  }
  return count.value >= effectiveMinCount.value
}

const canSubmit = computed(() => isBidValid() && count.value <= props.maxCount)
const modeText = computed(() => mode.value === 'fei' ? '飛' : '齋')
</script>

<template>
  <div class="bg-cn-surface/90 border-t border-cn-gold/10">
    <!-- Vant Picker -->
    <Picker
      v-model="selectedValues"
      :columns="columns"
      :visible-option-num="3"
      :option-height="40"
      :show-toolbar="false"
      @change="onChange"
    />

    <!-- Action buttons -->
    <div class="flex gap-2.5 px-4 pb-3">
      <Button
        class="bid-submit-btn"
        :disabled="!canSubmit"
        @click="$emit('bid', { count, face, mode })"
      >
        <span class="font-serif-cn text-lg">叫! {{ count }}個{{ face }} {{ modeText }}</span>
      </Button>
      <Button
        v-if="previousBid"
        class="bid-challenge-btn"
        @click="$emit('challenge')"
      >
        <span class="font-serif-cn text-lg font-bold">開!</span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.bid-submit-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  background: oklch(48% 0.2 25);
  border: 1px solid oklch(72% 0.14 75 / 0.2);
  color: oklch(72% 0.14 75);
  cursor: pointer;
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 100ms;
}
.bid-submit-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}
.bid-submit-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.bid-challenge-btn {
  padding: 0 24px;
  height: 48px;
  border-radius: 12px;
  background: oklch(72% 0.14 75);
  border: none;
  color: oklch(10% 0.02 60);
  font-weight: bold;
  cursor: pointer;
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 100ms;
}
.bid-challenge-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}

:deep(.van-picker) {
  background: transparent !important;
}
:deep(.van-picker__mask) {
  background: linear-gradient(180deg, oklch(10% 0.02 60 / 0.85), oklch(10% 0.02 60 / 0) 30%, oklch(10% 0.02 60 / 0) 70%, oklch(10% 0.02 60 / 0.85)) !important;
}
:deep(.van-picker__frame) {
  border-color: oklch(72% 0.14 75 / 0.15) !important;
}
:deep(.van-picker-column__item) {
  color: oklch(92% 0.03 75 / 0.3) !important;
}
:deep(.van-picker-column__item--selected) {
  color: oklch(72% 0.14 75) !important;
  font-weight: bold;
  font-size: 18px;
}
</style>
