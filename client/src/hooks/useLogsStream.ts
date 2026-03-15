import { useEffect, useRef, useState } from 'react'

export interface LogEntry {
  ts: string
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'
  modulo: string
  mensaje: string
}

const MAX_LOGS = 200

export function useLogsStream() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/api/logs'
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen  = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (e) => {
      try {
        const entry: LogEntry = JSON.parse(e.data)
        setLogs((prev) => [entry, ...prev].slice(0, MAX_LOGS))
      } catch {
        // ignorar mensajes malformados
      }
    }

    return () => ws.close()
  }, [])

  const clear = () => setLogs([])

  return { logs, connected, clear }
}
