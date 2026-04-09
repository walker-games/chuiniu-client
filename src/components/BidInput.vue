<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Picker, type PickerOption } from 'vant'
import 'vant/es/picker/style'
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

// Picker columns
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
  { text: '🎲 飞', value: 'fei' },
  { text: '🔒 斋', value: 'zhai' },
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
const modeText = computed(() => mode.value === 'fei' ? '🎲飞' : '🔒斋')
</script>

<template>
  <div class="bg-cn-wood/90 border-t border-cn-gold/40">
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
    <div class="flex gap-2 px-4 pb-3">
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

<style scoped>
:deep(.van-picker) {
  background: transparent !important;
}
:deep(.van-picker__mask) {
  background: linear-gradient(180deg, rgba(26,26,26,0.8), rgba(26,26,26,0) 30%, rgba(26,26,26,0) 70%, rgba(26,26,26,0.8)) !important;
}
:deep(.van-picker__frame) {
  border-color: rgba(212, 168, 83, 0.3) !important;
}
:deep(.van-picker-column__item) {
  color: rgba(245, 230, 200, 0.5) !important;
}
:deep(.van-picker-column__item--selected) {
  color: #D4A853 !important;
  font-weight: bold;
  font-size: 18px;
}
</style>
