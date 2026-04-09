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
    <div class="mb-6 animate-fade-up">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-cn-muted text-xs">房間</span>
        <span class="text-cn-gold font-serif-cn text-lg font-bold tracking-wider">{{ roomId.slice(0, 6) }}</span>
      </div>
      <p class="text-cn-muted text-xs tracking-wider">等待玩家加入...</p>
    </div>

    <!-- Player row -->
    <div class="flex gap-2.5 justify-center flex-wrap mb-4 animate-fade-up stagger-1">
      <PlayerSeat
        v-for="(p, idx) in players"
        :key="p.id"
        :player="p"
        :is-host="p.id === roomStore.room?.host"
        :style="{ animationDelay: `${idx * 50}ms` }"
        class="animate-fade-up"
      />
      <PlayerSeat
        v-for="i in emptySeats"
        :key="'empty-' + i"
        empty
      />
    </div>

    <!-- QR Share -->
    <div class="flex justify-center mb-8 animate-fade-up stagger-2">
      <QrShare :invite-code="inviteCode" />
    </div>

    <!-- Entering overlay -->
    <div v-if="entering" class="fixed inset-0 z-50 bg-cn-ink/95 flex flex-col items-center justify-center">
      <div class="w-10 h-10 border-2 border-cn-gold/30 border-t-cn-gold rounded-full animate-spin mb-4" />
      <p class="text-cn-gold font-serif-cn text-xl">進入遊戲中...</p>
    </div>

    <!-- Ready button -->
    <div class="mt-auto flex justify-center pb-6 animate-fade-up stagger-3">
      <Button
        v-if="!entering"
        class="lobby-ready-btn"
        :class="isReady ? 'lobby-ready-btn--active' : ''"
        size="large"
        @click="toggleReady"
      >
        <span class="font-serif-cn text-xl tracking-wider">{{ isReady ? '取消準備' : '準 備' }}</span>
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
  background: oklch(48% 0.2 25);
  border: 1.5px solid oklch(72% 0.14 75 / 0.3);
  color: oklch(72% 0.14 75);
  font-weight: bold;
  cursor: pointer;
  transition: transform 100ms cubic-bezier(0.16, 1, 0.3, 1), opacity 100ms;
}
.lobby-ready-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}
.lobby-ready-btn--active {
  background: oklch(15% 0.02 60 / 0.5);
  border-color: oklch(92% 0.03 75 / 0.15);
  color: oklch(92% 0.03 75 / 0.35);
}
</style>
