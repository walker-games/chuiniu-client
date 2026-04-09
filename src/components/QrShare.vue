<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import QRCode from 'qrcode'
import { useTelegram } from '@/composables/useTelegram'

const props = defineProps<{
  inviteCode: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const copied = ref(false)
const { tg } = useTelegram()

const botName = import.meta.env.VITE_TG_BOT_NAME || 'WalkerLearnBot'
const link = ref('')

function updateLink() {
  // Deep link into CardLottery with chuiniu_ prefix so it auto-opens in iframe
  link.value = `https://t.me/${botName}?startapp=chuiniu_${props.inviteCode}`
}

async function renderQR() {
  updateLink()
  if (!canvasRef.value) return
  await QRCode.toCanvas(canvasRef.value, link.value, {
    width: 180,
    margin: 2,
    color: { dark: '#D4A853', light: '#1A1A1A' },
  })
}

function copyLink() {
  navigator.clipboard.writeText(link.value).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}

function shareToTG() {
  const text = encodeURIComponent('来吹牛骰子！')
  const url = encodeURIComponent(link.value)
  tg?.openTelegramLink(`https://t.me/share/url?url=${url}&text=${text}`)
}

onMounted(renderQR)
watch(() => props.inviteCode, renderQR)
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <canvas ref="canvasRef" class="rounded-lg" />
    <div class="flex gap-3">
      <button
        class="px-4 py-1.5 rounded border border-cn-gold text-cn-gold text-sm
               active:bg-cn-gold/20 transition-colors"
        @click="copyLink"
      >
        {{ copied ? '已复制' : '复制链接' }}
      </button>
      <button
        class="px-4 py-1.5 rounded bg-cn-gold/20 border border-cn-gold text-cn-gold text-sm
               active:bg-cn-gold/30 transition-colors"
        @click="shareToTG"
      >
        TG 分享
      </button>
    </div>
  </div>
</template>
