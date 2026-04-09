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
        class="w-10 h-10 rounded-full border border-dashed border-cn-cream/20
               flex items-center justify-center text-cn-cream/20 text-lg"
      >+</div>
    </template>

    <!-- Occupied seat -->
    <template v-else>
      <div
        class="w-10 h-10 rounded-full border-2 flex items-center justify-center
               text-sm font-bold font-chinese transition-all duration-300"
        :class="player.ready
          ? 'border-cn-gold bg-cn-gold/20 text-cn-gold'
          : 'border-cn-cream/30 bg-cn-ink/60 text-cn-cream/60'"
      >
        {{ player.name?.charAt(0) || '?' }}
      </div>
      <span class="text-[10px] text-cn-cream/80 truncate max-w-12 text-center leading-tight">
        {{ player.name }}
      </span>
    </template>
  </div>
</template>
