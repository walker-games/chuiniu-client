<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  // Show punishment after delay
  setTimeout(() => {
    if (punishmentText.value) {
      showPunishment.value = true
    }
  }, 1500)
})
</script>

<template>
  <div class="min-h-screen flex flex-col px-4 py-6">
    <!-- Header -->
    <h1 class="text-3xl font-chinese text-cn-gold text-center mb-6">开奖!</h1>

    <template v-if="result">
      <!-- Challenge info -->
      <div class="text-center mb-4 py-3 bg-cn-wood/30 rounded-lg space-y-1">
        <p class="text-cn-cream/60 text-sm">
          <span class="text-cn-gold">{{ targetName }}</span> 叫:
          <span class="text-cn-gold font-chinese text-lg">{{ bidText }}</span>
        </p>
        <p class="text-cn-cream/60 text-sm">
          <span class="text-cn-red">{{ challengerName }}</span> 开了!
        </p>
      </div>

      <!-- All dice revealed -->
      <div class="space-y-3 mb-6">
        <div
          v-for="(dice, playerId) in result.allDice"
          :key="playerId"
          class="flex items-center gap-3 px-3 py-2 rounded-lg"
          :class="playerId === result.loser ? 'bg-cn-red/20' : 'bg-cn-ink/30'"
        >
          <span class="text-sm text-cn-cream/80 min-w-14 truncate">
            {{ getPlayerName(playerId as string) }}
          </span>
          <div class="flex gap-1.5 flex-wrap">
            <DiceFace v-for="(d, i) in dice" :key="i" :value="d" />
          </div>
        </div>
      </div>

      <!-- Actual count -->
      <div class="text-center mb-4">
        <span class="text-cn-cream/50 text-sm">实际数量:</span>
        <span class="text-cn-gold font-chinese text-2xl ml-2">{{ result.actualCount }}</span>
      </div>

      <!-- Win/lose -->
      <div class="text-center mb-8">
        <p
          class="font-chinese text-2xl"
          :class="isWinner ? 'text-cn-gold' : 'text-cn-red'"
        >
          {{ isWinner ? '你赢了!' : '你输了...' }}
        </p>
      </div>
    </template>

    <!-- Next round -->
    <div class="mt-auto pb-6 flex justify-center">
      <button
        class="w-full max-w-64 py-3.5 rounded-xl bg-cn-red border-2 border-cn-gold
               text-cn-gold font-chinese text-xl
               active:bg-cn-dark-red transition-colors"
        @click="nextRound"
      >
        下一轮
      </button>
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
