<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from 'vant'
import 'vant/es/button/style'
import { useTelegram } from '@/composables/useTelegram'
import { useAuthStore } from '@/stores/auth'
import { createRoom, joinRoom } from '@/api/room'

const router = useRouter()
const { ready, inTelegram, startParam } = useTelegram()
const authStore = useAuthStore()

const inviteCode = ref('')
const error = ref('')
const loading = ref(false)

async function autoLogin() {
  if (authStore.isLoggedIn) return

  const urlParams = new URLSearchParams(window.location.search)
  const parentToken = urlParams.get('token')
  const parentUser = urlParams.get('user')
  if (parentToken) {
    authStore.devLogin(parentUser || 'iframe-user', parentUser || '玩家')
    return
  }

  if (inTelegram.value) {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user
    const userId = tgUser?.id?.toString() || `tg-${Date.now()}`
    const name = tgUser?.first_name || `玩家${Math.floor(Math.random() * 1000)}`
    authStore.devLogin(userId, name)
    return
  }

  const devId = `dev-${Date.now()}`
  authStore.devLogin(devId, `玩家${Math.floor(Math.random() * 1000)}`)
}

async function handleCreate() {
  error.value = ''
  loading.value = true
  try {
    const res = await createRoom(authStore.user?.name)
    router.push(`/lobby/${res.room_id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '创建房间失败'
  } finally {
    loading.value = false
  }
}

async function handleJoin(code?: string) {
  const joinCode = code || inviteCode.value.trim()
  if (!joinCode) {
    error.value = '请输入邀请码'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const res = await joinRoom(joinCode, authStore.user?.name)
    router.push(`/lobby/${res.room_id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加入房间失败'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  ready()
  await autoLogin()

  const urlCode = new URLSearchParams(window.location.search).get('code')
  const joinCode = startParam.value || urlCode
  if (joinCode) {
    await handleJoin(joinCode)
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-pattern">
    <!-- Decorative top border -->
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cn-gold/40 to-transparent" />

    <!-- Title -->
    <h1 class="text-6xl font-serif-cn text-gold-gradient mb-2 select-none font-bold tracking-wide">
      吹牛骰子
    </h1>
    <p class="text-cn-cream/40 text-sm mb-12 tracking-[0.3em] font-serif-cn">
      港式骰盅 &middot; 派对必备
    </p>

    <!-- Error -->
    <div v-if="error" class="mb-4 px-4 py-2.5 rounded-xl glass-card border-cn-red/40 text-cn-red text-sm max-w-64 w-full text-center">
      {{ error }}
    </div>

    <!-- Create room -->
    <Button
      class="home-btn-create"
      size="large"
      :loading="loading"
      loading-text="创建中..."
      @click="handleCreate"
    >
      <span class="font-serif-cn text-2xl tracking-wider">开 桌</span>
    </Button>

    <!-- Divider -->
    <div class="flex items-center gap-3 my-8 w-full max-w-64">
      <div class="flex-1 h-px bg-gradient-to-r from-transparent to-cn-gold/20" />
      <span class="text-cn-cream/25 text-xs font-serif-cn">或</span>
      <div class="flex-1 h-px bg-gradient-to-l from-transparent to-cn-gold/20" />
    </div>

    <!-- Join room -->
    <div class="w-full max-w-64 space-y-3">
      <input
        v-model="inviteCode"
        type="text"
        placeholder="输入邀请码"
        class="w-full px-4 py-3 rounded-xl bg-cn-surface/80 border border-cn-cream/10
               text-cn-cream placeholder-cn-cream/25 text-center text-lg
               focus:outline-none focus:border-cn-gold/60 focus:shadow-[0_0_12px_rgba(212,168,83,0.15)]
               transition-all duration-200"
        @keyup.enter="handleJoin()"
      />
      <Button
        class="home-btn-join"
        size="large"
        :disabled="loading || !inviteCode.trim()"
        @click="handleJoin()"
      >
        <span class="font-serif-cn text-xl tracking-wider">入 座</span>
      </Button>
    </div>

    <!-- History link -->
    <button
      class="mt-10 text-cn-cream/25 text-sm underline underline-offset-4
             active:text-cn-cream/50 transition-colors duration-200 cursor-pointer"
      @click="router.push('/history')"
    >
      查看战绩
    </button>

    <!-- Decorative bottom border -->
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cn-gold/20 to-transparent" />
  </div>
</template>

<style scoped>
.home-btn-create {
  width: 100%;
  max-width: 256px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #C41E2A 0%, #8B1A1A 100%);
  border: 2px solid #D4A853;
  color: #D4A853;
  font-weight: bold;
  cursor: pointer;
  transition: all 200ms ease;
  box-shadow: 0 4px 20px rgba(196, 30, 42, 0.3), 0 0 12px rgba(212, 168, 83, 0.1);
}
.home-btn-create:active {
  transform: scale(0.97);
  background: linear-gradient(135deg, #8B1A1A 0%, #6B1414 100%);
}

.home-btn-join {
  width: 100%;
  height: 48px;
  border-radius: 14px;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(212, 168, 83, 0.4);
  color: #D4A853;
  cursor: pointer;
  transition: all 200ms ease;
}
.home-btn-join:active {
  background: rgba(26, 26, 46, 0.9);
}
.home-btn-join:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
