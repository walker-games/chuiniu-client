<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from 'vant'
import 'vant/es/button/style'
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
import type { RollResultData } from '@/types/ws'

const route = useRoute()
const authStore = useAuthStore()
const roomStore = useRoomStore()
const gameStore = useGameStore()
const { connected, connect, send, on } = useWebSocket()
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
const eyeBtn = ref<HTMLDivElement | null>(null)

// Draggable eye button
let eyeDragging = false
let eyeMoved = false
let eyeStartX = 0, eyeStartY = 0, eyeOrigLeft = 0, eyeOrigTop = 0

function onEyeTouchStart(e: TouchEvent) {
  eyeDragging = true; eyeMoved = false
  eyeStartX = e.touches[0].clientX; eyeStartY = e.touches[0].clientY
  if (eyeBtn.value) {
    const r = eyeBtn.value.getBoundingClientRect()
    eyeOrigLeft = r.left; eyeOrigTop = r.top
  }
}
function onEyeTouchMove(e: TouchEvent) {
  if (!eyeDragging || !eyeBtn.value) return
  const dx = e.touches[0].clientX - eyeStartX
  const dy = e.touches[0].clientY - eyeStartY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) eyeMoved = true
  eyeBtn.value.style.left = Math.max(4, Math.min(window.innerWidth - 52, eyeOrigLeft + dx)) + 'px'
  eyeBtn.value.style.top = Math.max(4, Math.min(window.innerHeight - 52, eyeOrigTop + dy)) + 'px'
  eyeBtn.value.style.right = 'auto'
  eyeBtn.value.style.bottom = 'auto'
}
function onEyeTouchEnd() {
  eyeDragging = false
  if (!eyeMoved) showDice.value = !showDice.value
}
function onEyeMouseDown(e: MouseEvent) {
  eyeDragging = true; eyeMoved = false
  eyeStartX = e.clientX; eyeStartY = e.clientY
  if (eyeBtn.value) {
    const r = eyeBtn.value.getBoundingClientRect()
    eyeOrigLeft = r.left; eyeOrigTop = r.top
  }
  const onMove = (ev: MouseEvent) => {
    if (!eyeDragging || !eyeBtn.value) return
    const dx = ev.clientX - eyeStartX, dy = ev.clientY - eyeStartY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) eyeMoved = true
    eyeBtn.value.style.left = Math.max(4, Math.min(window.innerWidth - 52, eyeOrigLeft + dx)) + 'px'
    eyeBtn.value.style.top = Math.max(4, Math.min(window.innerHeight - 52, eyeOrigTop + dy)) + 'px'
    eyeBtn.value.style.right = 'auto'; eyeBtn.value.style.bottom = 'auto'
  }
  const onUp = () => {
    eyeDragging = false
    if (!eyeMoved) showDice.value = !showDice.value
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

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
  console.log('[Game] handleRoll, connected:', connected.value, 'phase:', gameStore.phase)
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
  hasRolled.value = false
  showNextRound.value = false
  addMsg('system', '--- 新一轮 ---')
  send('ready', { ready: true })
}

onMounted(() => {
  initAudio()
  connect(roomId, authStore.token, authStore.user?.name)

  addMsg('system', '进入房间，等待游戏开始...')

  on('room_state', (msg: WSMessage) => {
    console.log('[Game] room_state received, phase:', (msg.data as any)?.round?.phase, 'players:', (msg.data as any)?.players?.length)
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
    console.log('[Game] roll_result received:', (msg.data as any)?.dice)
    const data = msg.data as RollResultData
    gameStore.setDice(data.dice)
    hasRolled.value = true
    play('reveal')
    addMsg('roll', '', myId.value, '我')
  })

  on('game_start', () => {
    gameStore.reset()
    hasRolled.value = false
    showNextRound.value = false
    addMsg('system', `第${roundNumber.value}轮开始!`)
  })

  on('all_rolled', () => {
    gameStore.setPhase('bidding')
    addMsg('system', '全部就绪，开始叫点!')
  })

  on('bid_made', (msg: WSMessage) => {
    const data = msg.data as any
    gameStore.setBid({
      player_id: data.player_id,
      count: data.count,
      face: data.face,
      mode: data.mode as 'fei' | 'zhai',
    })
    const name = getPlayerName(data.player_id)
    const modeText = data.mode === 'fei' ? '飞' : '斋'
    addMsg('bid', `${data.count}个${data.face} ${modeText}`, data.player_id, name)
  })

  on('turn_change', (msg: WSMessage) => {
    const data = msg.data as any
    const turnId = data.turn_player_id || data.playerId
    gameStore.setTurn(turnId)
    const name = getPlayerName(turnId)
    addMsg('system', `轮到 ${name}`)
  })

  on('challenge_result', (msg: WSMessage) => {
    const data = msg.data as any
    gameStore.setPhase('settling')

    const challengerName = getPlayerName(data.challenger)
    const bidder = data.bid?.player_id || data.bid?.PlayerID || ''
    const bidderName = getPlayerName(bidder)
    addMsg('challenge', '', data.challenger, challengerName)

    const modeText = data.bid?.mode === 'fei' ? '飞' : '斋'
    const bidText = `${data.bid?.count}个${data.bid?.face} ${modeText}`
    const winnerName = getPlayerName(data.winner)
    const loserName = getPlayerName(data.loser)
    addMsg(
      'result',
      `${challengerName} 开 ${bidderName}\n叫点: ${bidText}\n实际: ${data.actual_count}个\n${winnerName} 赢! ${loserName} 受罚`,
    )
    play('challenge')
  })

  on('punishment', (msg: WSMessage) => {
    const data = msg.data as any
    const loserId = data.loser
    const name = getPlayerName(loserId)
    const punishText = typeof data.punishment === 'string' ? data.punishment : data.punishment?.text || '喝一杯'
    addMsg('result', `${name} 的惩罚: ${punishText}`)
    play('punishment')
    showNextRound.value = true
  })

  on('round_end', (_msg: WSMessage) => {
    showNextRound.value = true
  })
})
</script>

<template>
  <div class="h-screen flex flex-col bg-cn-ink">
    <!-- Top bar -->
    <div class="flex items-center justify-between px-4 py-2.5 border-b border-cn-gold/10 bg-cn-surface/60 shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-cn-gold font-serif-cn text-base font-bold">第{{ roundNumber }}轮</span>
      </div>
      <div class="flex items-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cn-cream/30"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span class="text-cn-cream/40 text-xs">{{ playerCount }}人</span>
      </div>
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
        <Button
          class="game-roll-btn"
          size="large"
          @click="handleRoll"
        >
          <span class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M16 8h.01"/><path d="M12 12h.01"/><path d="M8 16h.01"/></svg>
            <span class="font-serif-cn text-lg">摇骰子</span>
          </span>
        </Button>
      </div>

      <!-- Rolling phase: waiting for others -->
      <div
        v-else-if="gameStore.phase === 'rolling' && hasRolled"
        class="px-4 py-4 text-center"
      >
        <p class="text-cn-cream/30 text-sm">等待其他玩家摇骰子...</p>
      </div>

      <!-- Bidding phase: my turn -->
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
        class="px-4 py-4 text-center"
      >
        <p class="text-cn-cream/35 font-serif-cn text-sm">
          等待 <span class="text-cn-gold/70">{{ currentTurnName }}</span> 叫点...
        </p>
      </div>

      <!-- Settling phase: next round button -->
      <div v-else-if="showNextRound" class="px-4 py-3">
        <Button
          class="game-next-btn"
          size="large"
          @click="handleNextRound"
        >
          <span class="font-serif-cn text-lg font-bold">下一轮</span>
        </Button>
      </div>
    </div>

    <!-- Draggable eye button -->
    <div
      v-if="hasRolled && gameStore.phase !== 'rolling'"
      ref="eyeBtn"
      class="fixed w-12 h-12 rounded-full bg-cn-surface border border-cn-gold/40
             flex items-center justify-center shadow-lg z-40 select-none cursor-pointer
             animate-ring-glow"
      style="right: 12px; bottom: 100px; touch-action: none;"
      @touchstart.prevent="onEyeTouchStart"
      @touchmove.prevent="onEyeTouchMove"
      @touchend="onEyeTouchEnd"
      @mousedown.prevent="onEyeMouseDown"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-cn-gold"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
    </div>

    <!-- Dice viewer bottom sheet -->
    <DiceViewer
      :dice="gameStore.myDice"
      :visible="showDice"
      @close="showDice = false"
    />
  </div>
</template>

<style scoped>
.game-roll-btn {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #C41E2A 0%, #8B1A1A 100%);
  border: 1px solid #D4A853;
  color: #D4A853;
  cursor: pointer;
  transition: all 200ms ease;
}
.game-roll-btn:active {
  transform: scale(0.97);
  background: linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%);
}

.game-next-btn {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #D4A853 0%, #A68640 100%);
  border: none;
  color: #0F0F1A;
  font-weight: bold;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 4px 16px rgba(212, 168, 83, 0.25);
}
.game-next-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}
</style>
