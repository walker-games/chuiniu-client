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
  <div ref="feedEl" class="flex-1 overflow-y-auto px-4 py-3 space-y-1 scroll-smooth">
    <div
      v-for="(msg, idx) in messages"
      :key="msg.id"
      class="animate-slide-in"
      :style="{ animationDelay: `${Math.min(idx, 5) * 50}ms` }"
    >
      <!-- system message: left-aligned, small, muted -->
      <div v-if="msg.type === 'system'" class="text-cn-muted text-xs py-1 pl-1 leading-relaxed">
        {{ msg.text }}
      </div>

      <!-- roll message -->
      <div v-else-if="msg.type === 'roll'" class="flex items-center gap-1.5 py-0.5">
        <span class="text-cn-cream/45 text-[0.8125rem] font-bold">{{ msg.playerName }}</span>
        <span class="text-cn-muted text-xs">已摇</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-cn-gold/50"><polyline points="20 6 9 17 4 12"/></svg>
      </div>

      <!-- bid message: name left, value in gold -->
      <div v-else-if="msg.type === 'bid'" class="flex items-baseline gap-2 py-0.5">
        <span class="text-cn-cream/70 text-[0.8125rem] font-bold shrink-0">{{ msg.playerName }}</span>
        <span class="text-cn-gold font-serif-cn text-base font-bold">{{ msg.text }}</span>
      </div>

      <!-- challenge message -->
      <div v-else-if="msg.type === 'challenge'" class="flex items-center gap-1.5 py-1.5">
        <span class="text-cn-red text-lg font-bold font-serif-cn">
          {{ msg.playerName }}: 开!
        </span>
      </div>

      <!-- result message: structured card -->
      <div
        v-else-if="msg.type === 'result'"
        class="my-2 px-4 py-3 rounded-xl surface-card"
      >
        <div class="space-y-1">
          <template v-for="(line, i) in msg.text.split('\n')" :key="i">
            <p v-if="line.includes('赢')" class="text-cn-gold font-bold font-serif-cn text-sm">{{ line }}</p>
            <p v-else-if="line.includes('惩罚')" class="text-cn-red font-serif-cn text-sm">{{ line }}</p>
            <p v-else-if="line.includes('叫点')" class="text-cn-gold/70 text-sm">{{ line }}</p>
            <p v-else class="text-cn-cream/60 text-sm leading-relaxed">{{ line }}</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
