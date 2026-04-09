const BASE = import.meta.env.VITE_API_BASE ?? ''

async function authFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token') ?? ''
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export function createRoom(name?: string) {
  return authFetch('/api/v1/rooms', {
    method: 'POST',
    body: JSON.stringify({ name: name || '' }),
  })
}

export function joinRoom(code: string, name?: string) {
  return authFetch('/api/v1/rooms/join', {
    method: 'POST',
    body: JSON.stringify({ code, name: name || '' }),
  })
}

export function getRoom(roomId: string) {
  return authFetch(`/api/v1/rooms/${roomId}`)
}
