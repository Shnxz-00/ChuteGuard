import { useStore } from "./store"

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

export function connectSocket() {
    if (socket) return

    socket = new WebSocket("ws://localhost:8000/ws/data")

    socket.onopen = () => {
        console.log("[socket] WebSocket connected")
        useStore.getState().setConnected(true)
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }
    }

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data)
            useStore.getState().updateFromSocket(data)
        } catch (e) {
            console.error("[socket] Parse error:", e)
        }
    }

    socket.onclose = () => {
        console.log("[socket] WebSocket disconnected — will retry in 3s")
        useStore.getState().setConnected(false)
        socket = null
        reconnectTimer = setTimeout(() => connectSocket(), 3000)
    }

    socket.onerror = (err) => {
        console.error("[socket] WebSocket error:", err)
        socket?.close()
    }
}

export function sendManualPulse() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "MANUAL_PULSE" }))
    }
}

export function disconnectSocket() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
    }
    if (socket) {
        socket.onclose = null   // suppress auto-reconnect
        socket.close()
        socket = null
    }
    useStore.getState().setConnected(false)
}