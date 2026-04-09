<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { useGameStore } from '@/stores/game'
import { useAudio } from '@/composables/useAudio'
import DiceCup from '@/components/DiceCup.vue'
import DiceFace from '@/components/DiceFace.vue'
import BidPanel from '@/components/BidPanel.vue'
import type { WSMessage } from '@/types/ws'
import type {
  RollResultData,
  BidMadeData,
  TurnChangeData,
  ChallengeResultData,
  PunishmentData,
} from '@/types/ws'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const roomStore = useRoomStore()
const gameStore = useGameStore()
const { connect, send, on } = useWebSocket()
const { init: initAudio, play } = useAudio()

const roomId = route.params.roomId as string
const myId = computed(() => authStore.user?.id ?? '')
const isMyTurn = computed(() => gameStore.currentTurn === myId.value)
const players = computed(() => roomStore.room?.players ?? [])

const phaseText = computed(() => {
  switch (gameStore.phase) {
    case 'rolling': return '摇骰子'
    case 'bidding': return '叫点'
    case 'challenging': return '开盅'
    case 'settling': return '结算中'
    default: return ''
  }
})

const currentBidder = computed(() => {
  if (!gameStore.currentBid) return ''
  const p = players.value.find((pl) => pl.id === gameStore.currentBid!.player_id)
  return p?.name ?? '???'
})

const currentBidText = computed(() => {
  const bid = gameStore.currentBid
  if (!bid) return ''
  const modeText = bid.mode === 'fei' ? '飞' : '斋'
  return `${bid.count}个${bid.face} ${modeText}`
})

const currentTurnName = computed(() => {
  const p = players.value.find((pl) => pl.id === gameStore.currentTurn)
  return p?.name ?? ''
})

const roundNumber = computed(() => roomStore.room?.round?.number ?? 1)

function handleRoll() {
  send('roll', {})
  play('shake')
}

function handleBid(payload: { count: number; face: number; mode: 'fei' | 'zhai' }) {
  send('bid', payload)
  play('bid')
}

function handleChallenge() {
  send('challenge', {})
  play('challenge')
}

onMounted(() => {
  initAudio()
  connect(roomId, authStore.token)

  on('room_state', (msg: WSMessage) => {
    const data = msg.data as typeof roomStore.room & object
    roomStore.updateFromState(data)
    if (data.round) {
      gameStore.setPhase(data.round.phase)
      if (data.round.current_bid) {
        gameStore.setBid(data.round.current_bid)
      }
      const turnId = data.round.turn_order?.[data.round.turn_index]
      if (turnId) gameStore.setTurn(turnId)
    }
  })

  on('roll_result', (msg: WSMessage) => {
    const data = msg.data as RollResultData
    gameStore.setDice(data.dice)
    play('reveal')
  })

  on('all_rolled', () => {
    gameStore.setPhase('bidding')
  })

  on('bid_made', (msg: WSMessage) => {
    const data = msg.data as BidMadeData
    gameStore.setBid({
      player_id: data.playerId,
      count: data.count,
      face: data.face,
      mode: data.mode as 'fei' | 'zhai',
    })
  })

  on('turn_change', (msg: WSMessage) => {
    const data = msg.data as TurnChangeData
    gameStore.setTurn(data.playerId)
  })

  on('challenge_result', (msg: WSMessage) => {
    const data = msg.data as ChallengeResultData
    gameStore.challengeResult = data
    gameStore.setPhase('settling')
    router.push(`/result/${roomId}`)
  })

  on('punishment', (msg: WSMessage) => {
    const data = msg.data as PunishmentData
    gameStore.punishment = data
  })
})
</script>

<template>
  <div class="min-h-screen flex flex-col px-4 py-4">
    <!-- Round info -->
    <div class="text-center mb-4">
      <h1 class="text-xl font-chinese text-cn-gold">
        第 {{ roundNumber }} 轮 · {{ phaseText }}
      </h1>
    </div>

    <!-- Current bid display -->
    <div v-if="gameStore.currentBid" class="text-center mb-4 py-2 bg-cn-wood/30 rounded-lg">
      <span class="text-cn-cream/60 text-sm">{{ currentBidder }} 叫:</span>
      <span class="text-cn-gold font-chinese text-xl ml-2">{{ currentBidText }}</span>
    </div>

    <!-- Player grid -->
    <div class="grid grid-cols-4 gap-3 mb-6">
      <div
        v-for="p in players"
        :key="p.id"
        class="flex flex-col items-center gap-1 rounded-lg py-2 px-1 transition-all"
        :class="{
          'animate-pulse-gold': p.id === gameStore.currentTurn,
          'bg-cn-gold/10': p.id === gameStore.currentTurn,
        }"
      >
        <div
          class="w-10 h-10 rounded-full border flex items-center justify-center
                 text-sm font-bold font-chinese"
          :class="p.id === gameStore.currentTurn
            ? 'border-cn-gold bg-cn-gold/20 text-cn-gold'
            : 'border-cn-cream/30 bg-cn-ink/60 text-cn-cream/60'"
        >
          {{ p.name?.charAt(0) || '?' }}
        </div>
        <span class="text-[10px] text-cn-cream/70 truncate max-w-14">{{ p.name }}</span>
        <span class="text-[10px]" :class="p.rolled ? 'text-cn-gold' : 'text-cn-cream/30'">
          {{ p.rolled ? '已摇' : '等待' }}
        </span>
        <span class="text-[10px] text-cn-gold-dim">{{ p.score }}分</span>
      </div>
    </div>

    <!-- Rolling phase -->
    <div v-if="gameStore.phase === 'rolling'" class="flex-1 flex items-center justify-center">
      <DiceCup
        :dice="gameStore.myDice"
        :rolled="gameStore.myDice.length > 0"
        @roll="handleRoll"
      />
    </div>

    <!-- Bidding phase -->
    <div v-if="gameStore.phase === 'bidding'" class="flex-1 flex flex-col gap-4">
      <!-- My dice -->
      <div class="flex justify-center gap-2">
        <DiceFace v-for="(d, i) in gameStore.myDice" :key="i" :value="d" />
      </div>

      <!-- Bid panel or waiting message -->
      <div v-if="isMyTurn" class="mt-2">
        <BidPanel
          :can-challenge="!!gameStore.currentBid"
          @bid="handleBid"
          @challenge="handleChallenge"
        />
      </div>
      <div v-else class="text-center py-8">
        <p class="text-cn-cream/50 font-chinese text-lg">
          等待 {{ currentTurnName }} 叫点...
        </p>
      </div>
    </div>
  </div>
</template>
