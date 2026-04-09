<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { useGameStore } from '@/stores/game'
import { useAudio } from '@/composables/useAudio'
import ChatFeed from '@/components/ChatFeed.vue'
import BidInput from '@/components/BidInput.vue'
import DiceViewer from '@/components/DiceViewer.vue'
import type { WSMessage } from '@/types/ws'
import type { ChatMessage } from '@/types/game'
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
const playerCount = computed(() => players.value.length)
const roundNumber = computed(() => roomStore.room?.round?.number ?? 1)

const messages = ref<ChatMessage[]>([])
const showDice = ref(false)
const hasRolled = ref(false)
const showNextRound = ref(false)

let msgCounter = 0
function addMsg(type: ChatMessage['type'], text: string, playerId?: string, playerName?: string) {
  messages.value.push({
    id: `msg-${++msgCounter}`,
    type,
    playerId,
    playerName,
    text,
    timestamp: Date.now(),
  })
}

function getPlayerName(id: string): string {
  const p = players.value.find((pl) => pl.id === id)
  return p?.name ?? '???'
}

const currentTurnName = computed(() => getPlayerName(gameStore.currentTurn))

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

function handleNextRound() {
  gameStore.reset()
  messages.value = []
  hasRolled.value = false
  showNextRound.value = false
  router.push(`/lobby/${roomId}`)
}

onMounted(() => {
  initAudio()
  connect(roomId, authStore.token)

  addMsg('system', '进入房间，等待游戏开始...')

  on('room_state', (msg: WSMessage) => {
    const data = msg.data as typeof roomStore.room & object
    const prevPlayers = players.value.map((p) => ({ id: p.id, rolled: p.rolled }))
    roomStore.updateFromState(data)

    if (data.round) {
      gameStore.setPhase(data.round.phase)
      if (data.round.current_bid) {
        gameStore.setBid(data.round.current_bid)
      }
      const turnId = data.round.turn_order?.[data.round.turn_index]
      if (turnId) gameStore.setTurn(turnId)
    }

    // Detect other players rolling via state diff
    if (data.players) {
      for (const p of data.players) {
        if (p.id === myId.value) continue
        const prev = prevPlayers.find((pp) => pp.id === p.id)
        if (p.rolled && (!prev || !prev.rolled)) {
          addMsg('roll', '', p.id, p.name)
        }
      }
    }
  })

  on('roll_result', (msg: WSMessage) => {
    const data = msg.data as RollResultData
    gameStore.setDice(data.dice)
    hasRolled.value = true
    play('reveal')
    addMsg('roll', '', myId.value, '我')
  })

  on('all_rolled', () => {
    gameStore.setPhase('bidding')
    addMsg('system', '全部就绪，开始叫点！')
  })

  on('bid_made', (msg: WSMessage) => {
    const data = msg.data as BidMadeData
    gameStore.setBid({
      player_id: data.playerId,
      count: data.count,
      face: data.face,
      mode: data.mode as 'fei' | 'zhai',
    })
    const name = getPlayerName(data.playerId)
    const modeText = data.mode === 'fei' ? '飞' : '斋'
    addMsg('bid', `${data.count}个${data.face} ${modeText}`, data.playerId, name)
  })

  on('turn_change', (msg: WSMessage) => {
    const data = msg.data as TurnChangeData
    gameStore.setTurn(data.playerId)
    const name = getPlayerName(data.playerId)
    addMsg('system', `轮到 ${name}`)
  })

  on('challenge_result', (msg: WSMessage) => {
    const data = msg.data as ChallengeResultData
    gameStore.challengeResult = data
    gameStore.setPhase('settling')

    const challengerName = getPlayerName(data.challenger)
    const targetName = getPlayerName(data.target)
    addMsg('challenge', '', data.challenger, challengerName)

    const modeText = data.bid.mode === 'fei' ? '飞' : '斋'
    const bidText = `${data.bid.count}个${data.bid.face} ${modeText}`
    const winnerName = getPlayerName(data.winner)
    const loserName = getPlayerName(data.loser)
    addMsg(
      'result',
      `${challengerName} 开 ${targetName}\n叫点: ${bidText}\n实际: ${data.actualCount}个\n${winnerName} 赢！${loserName} 受罚`,
    )
    play('challenge')
  })

  on('punishment', (msg: WSMessage) => {
    const data = msg.data as PunishmentData
    const name = getPlayerName(data.playerId)
    addMsg('result', `${name} 的惩罚: ${data.punishment.text}`)
    play('punishment')
    showNextRound.value = true
  })

  on('round_end', (_msg: WSMessage) => {
    showNextRound.value = true
  })
})
</script>

<template>
  <div class="h-screen flex flex-col">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-cn-gold/20 bg-cn-ink shrink-0">
      <span class="text-cn-gold font-chinese text-base">第{{ roundNumber }}轮</span>
      <span class="text-cn-cream/50 text-xs">{{ playerCount }}人</span>
    </div>

    <!-- Chat feed -->
    <ChatFeed :messages="messages" />

    <!-- Bottom area -->
    <div class="shrink-0">
      <!-- Rolling phase: roll button -->
      <div
        v-if="gameStore.phase === 'rolling' && !hasRolled"
        class="px-4 py-3 flex justify-center"
      >
        <button
          class="w-full py-3 rounded-xl bg-cn-red border border-cn-gold text-cn-gold
                 font-chinese text-lg active:bg-cn-dark-red transition-colors"
          @click="handleRoll"
        >
          🎲 摇骰子
        </button>
      </div>

      <!-- Rolling phase: waiting for others (already rolled) -->
      <div
        v-else-if="gameStore.phase === 'rolling' && hasRolled"
        class="px-4 py-3 text-center"
      >
        <p class="text-cn-cream/40 text-sm">等待其他玩家摇骰子...</p>
      </div>

      <!-- Bidding phase: my turn => BidInput -->
      <div v-else-if="gameStore.phase === 'bidding' && isMyTurn">
        <BidInput
          :min-count="gameStore.currentBid ? gameStore.currentBid.count : 1"
          :max-count="playerCount * 5"
          :previous-bid="gameStore.currentBid"
          :player-count="playerCount"
          @bid="handleBid"
          @challenge="handleChallenge"
        />
      </div>

      <!-- Bidding phase: not my turn -->
      <div
        v-else-if="gameStore.phase === 'bidding' && !isMyTurn"
        class="px-4 py-3 text-center"
      >
        <p class="text-cn-cream/50 font-chinese text-sm">
          等待 {{ currentTurnName }} 叫点...
        </p>
      </div>

      <!-- Settling phase: next round button -->
      <div v-else-if="showNextRound" class="px-4 py-3">
        <button
          class="w-full py-3 rounded-xl bg-cn-gold text-cn-ink font-chinese
                 text-lg font-bold active:bg-cn-gold-dim transition-colors"
          @click="handleNextRound"
        >
          返回大厅
        </button>
      </div>
    </div>

    <!-- Floating eye button (after rolled, during bidding) -->
    <button
      v-if="hasRolled && gameStore.phase !== 'rolling'"
      class="fixed bottom-24 right-4 w-12 h-12 rounded-full bg-cn-wood border border-cn-gold/50
             flex items-center justify-center text-xl shadow-lg active:scale-95 transition-transform z-40"
      @click="showDice = !showDice"
    >
      👁
    </button>

    <!-- Dice viewer bottom sheet -->
    <DiceViewer
      :dice="gameStore.myDice"
      :visible="showDice"
      @close="showDice = false"
    />
  </div>
</template>
