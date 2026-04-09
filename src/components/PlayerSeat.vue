<script setup lang="ts">
import type { Player } from '@/types/game'

defineProps<{
  player?: Player
  isHost?: boolean
  empty?: boolean
}>()
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <!-- Empty seat -->
    <template v-if="empty || !player">
      <div
        class="w-10 h-10 rounded-full border border-dashed border-cn-cream/10
               flex items-center justify-center text-cn-cream/15 text-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
      </div>
    </template>

    <!-- Occupied seat -->
    <template v-else>
      <div class="relative">
        <div
          class="w-10 h-10 rounded-full border-2 flex items-center justify-center
                 text-sm font-bold font-serif-cn transition-all duration-300"
          :class="player.ready
            ? 'border-cn-gold bg-cn-gold/15 text-cn-gold animate-pulse-gold'
            : 'border-cn-cream/20 bg-cn-surface/60 text-cn-cream/50'"
        >
          {{ player.name?.charAt(0) || '?' }}
        </div>
        <!-- Host badge -->
        <div
          v-if="isHost"
          class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cn-gold flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="text-cn-ink"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
      </div>
      <span class="text-[10px] text-cn-cream/60 truncate max-w-12 text-center leading-tight">
        {{ player.name }}
      </span>
    </template>
  </div>
</template>
