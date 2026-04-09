<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'vant'
import 'vant/es/button/style'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { useGameStore } from '@/stores/game'
import DiceFace from '@/components/DiceFace.vue'
import PunishmentAnimation from '@/components/PunishmentAnimation.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const roomStore = useRoomStore()
const gameStore = useGameStore()

const roomId = route.params.roomId as string
const showPunishment = ref(false)

const result = computed(() => gameStore.challengeResult)
const players = computed(() => roomStore.room?.players ?? [])
const myId = computed(() => authStore.user?.id ?? '')

const challengerName = computed(() => {
  const p = players.value.find((pl) => pl.id === result.value?.challenger)
  return p?.name ?? '???'
})

const targetName = computed(() => {
  const p = players.value.find((pl) => pl.id === result.value?.target)
  return p?.name ?? '???'
})

const bidText = computed(() => {
  const bid = result.value?.bid
  if (!bid) return ''
  const modeText = bid.mode === 'fei' ? '飞' : '斋'
  return `${bid.count}个${bid.face} ${modeText}`
})

const loserName = computed(() => {
  const p = players.value.find((pl) => pl.id === result.value?.loser)
  return p?.name ?? '???'
})

const isWinner = computed(() => result.value?.winner === myId.value)

const punishmentText = computed(() => gameStore.punishment?.punishment?.text ?? '')

function getPlayerName(id: string) {
  const p = players.value.find((pl) => pl.id === id)
  return p?.name ?? id.slice(0, 6)
}

function nextRound() {
  gameStore.reset()
  router.push(`/lobby/${roomId}`)
}

onMounted(() => {
  if (!result.value) {
    router.push(`/lobby/${roomId}`)
    return
  }
  setTimeout(() => {
    if (punishmentText.value) {
      showPunishment.value = true
    }
  }, 1500)
})
</script>

<template>
  <div class="min-h-screen flex flex-col px-4 py-6 bg-pattern">
    <!-- Header -->
    <h1 class="result-title font-serif-cn text-center mb-6 font-bold animate-fade-up">开奖!</h1>

    <template v-if="result">
      <!-- Challenge info -->
      <div class="mb-4 py-3 surface-card px-4 space-y-1 animate-fade-up stagger-1">
        <p class="text-cn-cream/50 text-sm">
          <span class="text-cn-gold font-serif-cn">{{ targetName }}</span> 叫:
          <span class="text-cn-gold font-serif-cn text-lg font-bold">{{ bidText }}</span>
        </p>
        <p class="text-cn-cream/50 text-sm">
          <span class="text-cn-red font-serif-cn font-bold">{{ challengerName }}</span> 开了!
        </p>
      </div>

      <!-- All dice revealed -->
      <div class="space-y-3 mb-6 animate-fade-up stagger-2">
        <div
          v-for="(dice, playerId) in result.allDice"
          :key="playerId"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          :class="playerId === result.loser ? 'bg-cn-red/8 border border-cn-red/15' : 'surface-card'"
        >
          <span class="text-sm text-cn-cream/60 min-w-14 truncate font-serif-cn">
            {{ getPlayerName(playerId as string) }}
          </span>
          <div class="flex gap-1.5 flex-wrap">
            <DiceFace v-for="(d, i) in dice" :key="i" :value="d" />
          </div>
        </div>
      </div>

      <!-- Actual count -->
      <div class="mb-4 animate-fade-up stagger-3">
        <span class="text-cn-muted text-sm">实际数量:</span>
        <span class="text-cn-gold font-serif-cn text-2xl font-bold ml-2">{{ result.actualCount }}</span>
      </div>

      <!-- Win/lose -->
      <div class="mb-8 animate-fade-up stagger-4">
        <p
          class="font-serif-cn text-2xl font-bold"
          :class="isWinner ? 'text-cn-gold' : 'text-cn-red'"
        >
          {{ isWinner ? '你赢了!' : '你输了...' }}
        </p>
      </div>
    </template>

    <!-- Next round -->
    <div class="mt-auto pb-6 flex justify-center">
      <Button
        class="result-next-btn"
        size="large"
        @click="nextRound"
      >
        <span class="font-serif-cn text-xl tracking-wider">下一轮</span>
      </Button>
    </div>

    <!-- Punishment overlay -->
    <PunishmentAnimation
      v-if="showPunishment && punishmentText"
      :text="punishmentText"
      :loser-name="loserName"
      @close="showPunishment = false"
    />
  </div>
</template>

<style scoped>
.result-title {
  font-size: clamp(1.75rem, 6vw, 2.5rem);
  color: oklch(72% 0.14 75);
}

.result-next-btn {
  width: 100%;
  max-width: 256px;
  height: 52px;
  border-radius: 14px;
  background: oklch(48% 0.2 25);
  border: 1.5px solid oklch(72% 0.14 75 / 0.3);
  color: oklch(72% 0.14 75);
  font-weight: bold;
  cursor: pointer;
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 100ms;
}
.result-next-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}
</style>
