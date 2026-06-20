import { useEffect, useRef } from 'react'

const WS_HOST = location.host.includes('vercel.app') || location.host.includes('vercel')
  ? 'issuetrack-api.onrender.com'
  : location.host

export function useProjectWS(projectId, onEvent) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    if (!projectId) return
    let ws
    let cancelled = false

    ;(async () => {
      const r = await fetch('/api/session-token', { credentials: 'include' })
      if (!r.ok || cancelled) return
      const { token } = await r.json()
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      const wsUrl = `${proto}://${WS_HOST}/api/ws?project_id=${projectId}&token=${encodeURIComponent(token)}`
      ws = new WebSocket(wsUrl)
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          handlerRef.current?.(msg)
        } catch (_) {}
      }
    })()

    return () => {
      cancelled = true
      ws?.close()
    }
  }, [projectId])
}
