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
  <div ref="feedEl" class="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scroll-smooth">
    <div
      v-for="msg in messages"
      :key="msg.id"
      :class="{
        'text-center': msg.type === 'system' || msg.type === 'result',
      }"
    >
      <!-- system message -->
      <div v-if="msg.type === 'system'" class="text-cn-cream/25 text-xs py-1 tracking-wide">
        {{ msg.text }}
      </div>

      <!-- roll message -->
      <div v-else-if="msg.type === 'roll'" class="flex items-center gap-1.5 py-0.5">
        <span class="text-cn-cream/45 text-sm">{{ msg.playerName }}</span>
        <span class="text-cn-cream/20 text-xs">已摇</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-cn-gold/50"><polyline points="20 6 9 17 4 12"/></svg>
      </div>

      <!-- bid message -->
      <div v-else-if="msg.type === 'bid'" class="flex items-center gap-1.5 py-0.5">
        <span class="text-cn-cream text-sm">{{ msg.playerName }}:</span>
        <span class="text-cn-gold font-serif-cn text-base font-bold">{{ msg.text }}</span>
      </div>

      <!-- challenge message -->
      <div v-else-if="msg.type === 'challenge'" class="flex items-center gap-1.5 py-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cn-red"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/></svg>
        <span class="text-cn-red text-lg font-bold font-serif-cn">
          {{ msg.playerName }}: 开!
        </span>
      </div>

      <!-- result message -->
      <div
        v-else-if="msg.type === 'result'"
        class="mx-2 my-2 px-4 py-3 rounded-xl glass-card border-cn-gold/30 text-center"
      >
        <div class="text-cn-cream/80 text-sm whitespace-pre-line leading-relaxed">
          <span v-for="(line, i) in msg.text.split('\n')" :key="i">
            <span v-if="line.includes('赢')" class="text-cn-gold font-bold font-serif-cn">{{ line }}</span>
            <span v-else-if="line.includes('惩罚')" class="text-cn-red font-serif-cn">{{ line }}</span>
            <span v-else-if="line.includes('叫点')" class="text-cn-gold/80">{{ line }}</span>
            <span v-else>{{ line }}</span>
            <br v-if="i < msg.text.split('\n').length - 1" />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
