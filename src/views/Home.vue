<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTelegram } from '@/composables/useTelegram'
import { useAuthStore } from '@/stores/auth'
import { createRoom, joinRoom } from '@/api/room'

const router = useRouter()
const { ready, inTelegram, initData, startParam } = useTelegram()
const authStore = useAuthStore()

const inviteCode = ref('')
const error = ref('')
const loading = ref(false)

async function autoLogin() {
  if (authStore.isLoggedIn) return
  if (inTelegram.value && initData.value) {
    try {
      await authStore.loginWithTelegram(initData.value)
    } catch (e: unknown) {
      error.value = '登录失败'
    }
  } else {
    // Dev mode fallback
    const devId = `dev-${Date.now()}`
    authStore.devLogin(devId, `玩家${Math.floor(Math.random() * 1000)}`)
  }
}

async function handleCreate() {
  error.value = ''
  loading.value = true
  try {
    const res = await createRoom()
    router.push(`/lobby/${res.room.id}`)
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
    const res = await joinRoom(joinCode)
    router.push(`/lobby/${res.room.id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加入房间失败'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  ready()
  await autoLogin()

  // Handle deep link auto-join
  if (startParam.value) {
    await handleJoin(startParam.value)
  }
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-6 py-12">
    <!-- Title -->
    <h1 class="text-6xl font-chinese text-cn-gold mb-2 select-none">
      吹牛骰子
    </h1>
    <p class="text-cn-cream/60 text-sm mb-12 tracking-widest">
      港式骰盅 · 派对必备
    </p>

    <!-- Error -->
    <div v-if="error" class="mb-4 px-4 py-2 rounded bg-cn-red/20 border border-cn-red/40 text-cn-red text-sm">
      {{ error }}
    </div>

    <!-- Create room -->
    <button
      class="w-full max-w-64 py-3.5 rounded-xl bg-cn-red border-2 border-cn-gold
             text-cn-gold font-chinese text-2xl tracking-wider
             active:bg-cn-dark-red transition-colors disabled:opacity-50"
      :disabled="loading"
      @click="handleCreate"
    >
      开 桌
    </button>

    <!-- Divider -->
    <div class="flex items-center gap-3 my-8 w-full max-w-64">
      <div class="flex-1 h-px bg-cn-cream/20" />
      <span class="text-cn-cream/30 text-xs">或</span>
      <div class="flex-1 h-px bg-cn-cream/20" />
    </div>

    <!-- Join room -->
    <div class="w-full max-w-64 space-y-3">
      <input
        v-model="inviteCode"
        type="text"
        placeholder="输入邀请码"
        class="w-full px-4 py-3 rounded-xl bg-cn-ink/60 border border-cn-cream/20
               text-cn-cream placeholder-cn-cream/30 text-center text-lg
               focus:outline-none focus:border-cn-gold transition-colors"
        @keyup.enter="handleJoin()"
      />
      <button
        class="w-full py-3 rounded-xl bg-cn-ink/40 border border-cn-gold/60
               text-cn-gold font-chinese text-xl tracking-wider
               active:bg-cn-ink/60 transition-colors disabled:opacity-50"
        :disabled="loading || !inviteCode.trim()"
        @click="handleJoin()"
      >
        入 座
      </button>
    </div>

    <!-- History link -->
    <button
      class="mt-10 text-cn-cream/30 text-sm underline underline-offset-4
             active:text-cn-cream/50 transition-colors"
      @click="router.push('/history')"
    >
      查看战绩
    </button>
  </div>
</template>
