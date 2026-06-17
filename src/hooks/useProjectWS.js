import { useEffect, useRef } from 'react'

export function useProjectWS(projectId, onEvent) {
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    if (!projectId) return
    const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws?project_id=${projectId}`
    const ws = new WebSocket(wsUrl)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        handlerRef.current?.(msg)
      } catch (_) {}
    }
    return () => ws.close()
  }, [projectId])
}
