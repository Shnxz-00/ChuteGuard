import { create } from "zustand"

export type Phase =
    | "Normal"
    | "Minimal Choking"
    | "Max Choking — Alert"

export type AlertEvent = {
    timestamp: string
    choke_percent: number
    action: string
}

export type SocketData = {
    timestamp: string
    choke_percent: number
    phase: Phase
    alert: {
        fired: boolean
        action: string | null
        choke_at_trigger: number | null
    } | null
    roi_box?: { top: number; bottom: number; left: number; right: number }
    raw_occupied_pixels?: number
    total_roi_pixels?: number
}

interface AppState {
    currentChoke: number
    currentPhase: Phase
    previousPhase: Phase
    alerts: AlertEvent[]
    history: { time: string; choke: number }[]
    role: "Operator" | "Supervisor"
    activeTab: "landing" | "dashboard" | "how-it-works" | "trends" | "architecture" | "journey"
    roiBox?: { top: number; bottom: number; left: number; right: number }
    rawOccupiedPixels?: number
    totalRoiPixels?: number
    emailAlertsEnabled: boolean
    soundAlertsEnabled: boolean
    choke_percent: number // Add this for compatibility with new hook
    phase: Phase // Add this for compatibility with new hook
    connected: boolean // Add this for compatibility with new hook
    updateFromSocket: (data: SocketData) => void
    setRole: (role: "Operator" | "Supervisor") => void
    setActiveTab: (tab: "landing" | "dashboard" | "how-it-works" | "trends" | "architecture" | "journey") => void
    setEmailAlertsEnabled: (enabled: boolean) => void
    setSoundAlertsEnabled: (enabled: boolean) => void
}

// Load alert preferences from localStorage
const loadAlertPreferences = () => {
    if (typeof window !== 'undefined') {
        const emailEnabled = localStorage.getItem('emailAlertsEnabled')
        const soundEnabled = localStorage.getItem('soundAlertsEnabled')
        return {
            emailAlertsEnabled: emailEnabled !== null ? emailEnabled === 'true' : true,
            soundAlertsEnabled: soundEnabled !== null ? soundEnabled === 'true' : true,
        }
    }
    return {
        emailAlertsEnabled: true,
        soundAlertsEnabled: true,
    }
}

const alertPreferences = loadAlertPreferences()

export const useStore = create<AppState>((set) => ({
    currentChoke: 0,
    currentPhase: "Normal",
    previousPhase: "Normal",
    alerts: [],
    history: [],
    role: "Operator",
    activeTab: "landing",
    roiBox: undefined,
    rawOccupiedPixels: undefined,
    totalRoiPixels: undefined,
    emailAlertsEnabled: alertPreferences.emailAlertsEnabled,
    soundAlertsEnabled: alertPreferences.soundAlertsEnabled,
    choke_percent: 0,
    phase: "Normal",
    connected: true,

    updateFromSocket: (data) => set((state) => {
        const newHistory = [
            ...state.history,
            {
                time: new Date(data.timestamp).toLocaleTimeString([], { hour12: false }),
                choke: data.choke_percent,
            },
        ]
        if (newHistory.length > 60) newHistory.shift()

        const newAlerts = [...state.alerts]
        if (data.alert?.fired && data.alert.action) {
            if (!newAlerts.find(a => a.timestamp === data.timestamp && a.action === data.alert!.action)) {
                newAlerts.unshift({
                    timestamp: data.timestamp,
                    choke_percent: data.alert.choke_at_trigger ?? data.choke_percent,
                    action: data.alert.action,
                })
                if (newAlerts.length > 30) newAlerts.pop()
            }
        }

        // Check for alert transition for sound alert
        const isAlert = data.phase === "Max Choking — Alert"
        const wasAlert = state.currentPhase === "Max Choking — Alert"
        
        if (isAlert && !wasAlert && state.soundAlertsEnabled) {
            // Trigger sound alert
            const utterance = new SpeechSynthesisUtterance(
                `Alert. Chute CH-01 max choking. Manual intervention required. Choke level ${Math.round(data.choke_percent)} percent.`
            )
            utterance.rate = 1.0
            speechSynthesis.speak(utterance)
        }

        return {
            currentChoke: data.choke_percent,
            currentPhase: data.phase,
            previousPhase: state.currentPhase,
            history: newHistory,
            alerts: newAlerts,
            roiBox: data.roi_box,
            rawOccupiedPixels: data.raw_occupied_pixels,
            totalRoiPixels: data.total_roi_pixels,
            choke_percent: data.choke_percent, // For compatibility with new hook
            phase: data.phase, // For compatibility with new hook
            connected: true, // For compatibility with new hook
        }
    }),

    setRole: (role) => set({ role }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setEmailAlertsEnabled: (enabled) => {
        localStorage.setItem('emailAlertsEnabled', enabled.toString())
        set({ emailAlertsEnabled: enabled })
    },
    setSoundAlertsEnabled: (enabled) => {
        localStorage.setItem('soundAlertsEnabled', enabled.toString())
        set({ soundAlertsEnabled: enabled })
    },
}))
