import { ref, onUnmounted } from 'vue'
import type { WSMessage } from '@/types/ws'

type MessageHandler = (msg: WSMessage) => void

export function useWebSocket() {
  const connected = ref(false)
  const handlers = new Map<string, MessageHandler[]>()
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let roomId = ''
  let token = ''

  function connect(wsRoomId: string, authToken: string) {
    roomId = wsRoomId
    token = authToken
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = location.host
    const url = `${protocol}//${host}/ws/${roomId}?token=${token}`
    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    }

    ws.onmessage = (event) => {
      const msg: WSMessage = JSON.parse(event.data)
      const msgHandlers = handlers.get(msg.type)
      if (msgHandlers) msgHandlers.forEach((h) => h(msg))
      const allHandlers = handlers.get('*')
      if (allHandlers) allHandlers.forEach((h) => h(msg))
    }

    ws.onclose = () => {
      connected.value = false
      reconnectTimer = setTimeout(() => {
        if (roomId && token) connect(roomId, token)
      }, 2000)
    }

    ws.onerror = () => { ws?.close() }
  }

  function send(type: string, data: Record<string, unknown> = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type, data, ts: Math.floor(Date.now() / 1000) }))
  }

  function on(type: string, handler: MessageHandler) {
    if (!handlers.has(type)) handlers.set(type, [])
    handlers.get(type)!.push(handler)
  }

  function off(type: string, handler: MessageHandler) {
    const list = handlers.get(type)
    if (list) { const idx = list.indexOf(handler); if (idx !== -1) list.splice(idx, 1) }
  }

  function disconnect() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    roomId = ''; token = ''
    ws?.close(); ws = null
  }

  onUnmounted(() => { disconnect() })

  return { connected, connect, send, on, off, disconnect }
}
