<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  // Connect WebSocket — server will send room_state immediately
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
  <div class="min-h-screen flex flex-col px-4 py-6">
    <!-- Header -->
    <div class="text-center mb-6">
      <h1 class="text-2xl font-chinese text-cn-gold">房间 {{ roomId.slice(0, 6) }}</h1>
      <p class="text-cn-cream/40 text-sm mt-1">等待玩家加入...</p>
    </div>

    <!-- Player row -->
    <div class="flex gap-2 justify-center flex-wrap mb-4">
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
    <div v-if="entering" class="fixed inset-0 z-50 bg-cn-ink/90 flex flex-col items-center justify-center">
      <div class="w-8 h-8 border-2 border-cn-gold/30 border-t-cn-gold rounded-full animate-spin mb-4" />
      <p class="text-cn-gold font-chinese text-xl">进入游戏中...</p>
    </div>

    <!-- Ready button -->
    <div class="mt-auto flex justify-center pb-6">
      <button
        v-if="!entering"
        class="w-full max-w-64 py-3.5 rounded-xl font-chinese text-xl tracking-wider
               transition-colors border-2"
        :class="isReady
          ? 'bg-cn-ink/40 border-cn-cream/30 text-cn-cream/60 active:bg-cn-ink/60'
          : 'bg-cn-red border-cn-gold text-cn-gold active:bg-cn-dark-red'"
        @click="toggleReady"
      >
        {{ isReady ? '取消准备' : '准备' }}
      </button>
    </div>
  </div>
</template>
