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
        class="w-14 h-14 rounded-full border-2 border-dashed border-cn-gold-dim/40
               flex items-center justify-center text-cn-gold-dim/40 text-2xl"
      >
        +
      </div>
      <span class="text-xs text-cn-cream/30">空位</span>
    </template>

    <!-- Occupied seat -->
    <template v-else>
      <div
        class="w-14 h-14 rounded-full border-2 flex items-center justify-center
               text-xl font-bold font-chinese transition-all duration-300"
        :class="player.ready
          ? 'border-cn-gold bg-cn-gold/20 text-cn-gold'
          : 'border-cn-cream/30 bg-cn-ink/60 text-cn-cream/60'"
      >
        {{ player.name?.charAt(0) || '?' }}
      </div>
      <span class="text-xs text-cn-cream/80 truncate max-w-16 text-center">
        {{ player.name }}
      </span>
      <span v-if="isHost" class="text-[10px] text-cn-gold">房主</span>
      <span v-else-if="player.ready" class="text-[10px] text-cn-gold">已准备</span>
    </template>
  </div>
</template>
