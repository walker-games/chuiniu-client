<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from 'vant'
import 'vant/es/button/style'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import PlayerSeat from '@/components/PlayerSeat.vue'
import QrShare from '@/components/QrShare.vue'
import type { WSMessage } from '@/types/ws'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const roomStore = useRoomStore()
const { connect, send, on } = useWebSocket()

const roomId = route.params.roomId as string
const isReady = ref(false)
const entering = ref(false)
const maxSeats = 8

const players = computed(() => roomStore.room?.players ?? [])
const inviteCode = computed(() => roomStore.room?.code ?? '')
const emptySeats = computed(() => {
  const count = maxSeats - players.value.length
  return count > 0 ? count : 0
})

function myPlayer() {
  return players.value.find((p) => p.id === authStore.user?.id)
}

function toggleReady() {
  isReady.value = !isReady.value
  send('ready', { ready: isReady.value })
}

onMounted(() => {
  connect(roomId, authStore.token, authStore.user?.name)

  on('room_state', (msg: WSMessage) => {
    roomStore.updateFromState(msg.data as typeof roomStore.room & object)
    const me = myPlayer()
    if (me) isReady.value = me.ready
  })

  on('player_left', (msg: WSMessage) => {
    const data = msg.data as { player_id: string }
    roomStore.removePlayer(data.player_id)
  })

  on('game_start', () => {
    entering.value = true
    setTimeout(() => router.push(`/game/${roomId}`), 500)
  })
})
</script>

<template>
  <div class="min-h-screen flex flex-col px-4 py-6 bg-pattern">
    <!-- Header -->
    <div class="text-center mb-6">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card">
        <span class="text-cn-gold/60 text-xs">房间</span>
        <span class="text-cn-gold font-serif-cn text-lg font-bold tracking-wider">{{ roomId.slice(0, 6) }}</span>
      </div>
      <p class="text-cn-cream/30 text-xs mt-2 tracking-wider">等待玩家加入...</p>
    </div>

    <!-- Player row -->
    <div class="flex gap-2.5 justify-center flex-wrap mb-4">
      <PlayerSeat
        v-for="p in players"
        :key="p.id"
        :player="p"
        :is-host="p.id === roomStore.room?.host"
      />
      <PlayerSeat
        v-for="i in emptySeats"
        :key="'empty-' + i"
        empty
      />
    </div>

    <!-- QR Share -->
    <div class="flex justify-center mb-8">
      <QrShare :invite-code="inviteCode" />
    </div>

    <!-- Entering overlay -->
    <div v-if="entering" class="fixed inset-0 z-50 bg-cn-ink/95 flex flex-col items-center justify-center">
      <div class="w-10 h-10 border-2 border-cn-gold/30 border-t-cn-gold rounded-full animate-spin mb-4" />
      <p class="text-gold-gradient font-serif-cn text-xl">进入游戏中...</p>
    </div>

    <!-- Ready button -->
    <div class="mt-auto flex justify-center pb-6">
      <Button
        v-if="!entering"
        class="lobby-ready-btn"
        :class="isReady ? 'lobby-ready-btn--active' : ''"
        size="large"
        @click="toggleReady"
      >
        <span class="font-serif-cn text-xl tracking-wider">{{ isReady ? '取消准备' : '准 备' }}</span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.lobby-ready-btn {
  width: 100%;
  max-width: 256px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #C41E2A 0%, #8B1A1A 100%);
  border: 2px solid #D4A853;
  color: #D4A853;
  font-weight: bold;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 4px 16px rgba(196, 30, 42, 0.3);
}
.lobby-ready-btn:active {
  transform: scale(0.97);
}
.lobby-ready-btn--active {
  background: rgba(26, 26, 46, 0.5);
  border-color: rgba(245, 230, 200, 0.2);
  color: rgba(245, 230, 200, 0.4);
  box-shadow: none;
}
</style>
