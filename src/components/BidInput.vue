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
  { text: '飞', value: 'fei' },
  { text: '斋', value: 'zhai' },
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
const modeText = computed(() => mode.value === 'fei' ? '飞' : '斋')
</script>

<template>
  <div class="bg-cn-surface/90 border-t border-cn-gold/15">
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
        <span class="font-serif-cn text-lg">叫! {{ count }}个{{ face }} {{ modeText }}</span>
      </Button>
      <Button
        v-if="previousBid"
        class="bid-challenge-btn"
        @click="$emit('challenge')"
      >
        <span class="flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/></svg>
          <span class="font-serif-cn text-lg font-bold">开!</span>
        </span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.bid-submit-btn {
  flex: 1;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #C41E2A 0%, #8B1A1A 100%);
  border: 1.5px solid #D4A853;
  color: #D4A853;
  cursor: pointer;
  transition: all 200ms ease;
}
.bid-submit-btn:active {
  transform: scale(0.97);
  background: linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%);
}
.bid-submit-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.bid-challenge-btn {
  padding: 0 24px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #D4A853 0%, #A68640 100%);
  border: none;
  color: #0F0F1A;
  font-weight: bold;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 2px 12px rgba(212, 168, 83, 0.25);
}
.bid-challenge-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}

:deep(.van-picker) {
  background: transparent !important;
}
:deep(.van-picker__mask) {
  background: linear-gradient(180deg, rgba(15,15,26,0.85), rgba(15,15,26,0) 30%, rgba(15,15,26,0) 70%, rgba(15,15,26,0.85)) !important;
}
:deep(.van-picker__frame) {
  border-color: rgba(212, 168, 83, 0.2) !important;
}
:deep(.van-picker-column__item) {
  color: rgba(245, 230, 200, 0.35) !important;
}
:deep(.van-picker-column__item--selected) {
  color: #D4A853 !important;
  font-weight: bold;
  font-size: 18px;
}
</style>
