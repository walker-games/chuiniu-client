<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'

const router = useRouter()
const roomStore = useRoomStore()

const players = computed(() => {
  if (!roomStore.room?.players) return []
  return [...roomStore.room.players].sort((a, b) => b.score - a.score)
})
</script>

<template>
  <div class="min-h-screen flex flex-col px-4 py-6">
    <!-- Header -->
    <div class="flex items-center mb-6">
      <button
        class="text-cn-cream/50 text-sm active:text-cn-cream/80"
        @click="router.back()"
      >
        &lt; 返回
      </button>
      <h1 class="flex-1 text-center text-2xl font-chinese text-cn-gold">战绩</h1>
      <div class="w-10" />
    </div>

    <!-- Player list -->
    <div v-if="players.length" class="space-y-3">
      <div
        v-for="(p, index) in players"
        :key="p.id"
        class="flex items-center gap-4 px-4 py-3 rounded-xl bg-cn-ink/40 border border-cn-cream/10"
      >
        <!-- Rank -->
        <span
          class="text-lg font-bold w-6 text-center"
          :class="index === 0 ? 'text-cn-gold' : 'text-cn-cream/40'"
        >
          {{ index + 1 }}
        </span>

        <!-- Avatar -->
        <div
          class="w-10 h-10 rounded-full border flex items-center justify-center
                 font-bold font-chinese"
          :class="index === 0
            ? 'border-cn-gold bg-cn-gold/20 text-cn-gold'
            : 'border-cn-cream/30 bg-cn-ink/60 text-cn-cream/60'"
        >
          {{ p.name?.charAt(0) || '?' }}
        </div>

        <!-- Name -->
        <span class="flex-1 text-cn-cream/80 truncate">{{ p.name }}</span>

        <!-- Score -->
        <span class="text-cn-gold font-chinese text-xl">{{ p.score }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex items-center justify-center">
      <p class="text-cn-cream/30 font-chinese text-lg">暂无战绩</p>
    </div>
  </div>
</template>
