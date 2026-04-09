<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '@/types/game'

const props = defineProps<{
  messages: ChatMessage[]
}>()

const feedEl = ref<HTMLElement | null>(null)

watch(
  () => props.messages.length,
  async () => {
    await nextTick()
    if (feedEl.value) {
      feedEl.value.scrollTop = feedEl.value.scrollHeight
    }
  },
)
</script>

<template>
  <div ref="feedEl" class="flex-1 overflow-y-auto px-3 py-2 space-y-2 scroll-smooth">
    <div
      v-for="msg in messages"
      :key="msg.id"
      :class="{
        'text-center': msg.type === 'system' || msg.type === 'result',
      }"
    >
      <!-- system message -->
      <div v-if="msg.type === 'system'" class="text-cn-cream/40 text-xs py-1">
        {{ msg.text }}
      </div>

      <!-- roll message -->
      <div v-else-if="msg.type === 'roll'" class="flex items-center gap-1.5 py-0.5">
        <span class="text-cn-cream/50 text-sm">{{ msg.playerName }}</span>
        <span class="text-cn-cream/30 text-xs">已摇 ✓</span>
      </div>

      <!-- bid message -->
      <div v-else-if="msg.type === 'bid'" class="flex items-center gap-1.5 py-0.5">
        <span class="text-cn-cream text-sm font-bold">{{ msg.playerName }}:</span>
        <span class="text-cn-gold font-chinese text-base">{{ msg.text }}</span>
      </div>

      <!-- challenge message -->
      <div v-else-if="msg.type === 'challenge'" class="flex items-center gap-1.5 py-1">
        <span class="text-cn-red text-base font-bold font-chinese">
          {{ msg.playerName }}: 开！
        </span>
      </div>

      <!-- result message -->
      <div
        v-else-if="msg.type === 'result'"
        class="mx-2 my-2 px-3 py-2.5 rounded-lg border border-cn-gold/60 bg-cn-wood/40 text-center"
      >
        <div class="text-cn-gold font-chinese text-sm whitespace-pre-line">{{ msg.text }}</div>
      </div>
    </div>
  </div>
</template>
