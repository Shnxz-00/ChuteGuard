import { create } from "zustand"

export type Phase =
    | "Normal Flow"
    | "Buildup Forming"
    | "Vibro-Assist Active"
    | "Escalated — Manual Intervention Required"

export type AlertEvent = {
    timestamp: string
    choke_percent: number
    action: string
}

export type SensorReadings = {
    left: number
    right: number
}

export type LeadTally = {
    left: number
    right: number
}

export type SocketData = {
    timestamp: string
    choke_percent: number
    phase: Phase
    sensors?: SensorReadings
    lead_sensor?: string
    lead_tally?: SensorReadings
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
    isConnected: boolean
    currentChoke: number
    currentPhase: Phase
    previousPhase: Phase
    sensors: SensorReadings
    leadSensor: string
    leadTally: LeadTally
    alerts: AlertEvent[]
    history: { time: string; choke: number; left: number; right: number; middle: number }[]
    role: "Operator" | "Supervisor"
    activeTab: "landing" | "dashboard" | "live-analysis" | "trends" | "architecture"
    roiBox?: { top: number; bottom: number; left: number; right: number }
    rawOccupiedPixels?: number
    totalRoiPixels?: number
    emailAlertsEnabled: boolean
    soundAlertsEnabled: boolean
    setConnected: (status: boolean) => void
    updateFromSocket: (data: SocketData) => void
    setRole: (role: "Operator" | "Supervisor") => void
    setActiveTab: (tab: "landing" | "dashboard" | "live-analysis" | "trends" | "architecture") => void
    setEmailAlertsEnabled: (enabled: boolean) => void
    setSoundAlertsEnabled: (enabled: boolean) => void
}

const DEFAULT_SENSORS: SensorReadings = { left: 0, right: 0 }
const DEFAULT_LEAD_TALLY: LeadTally = { left: 0, right: 0 }

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
    isConnected: false,
    currentChoke: 0,
    currentPhase: "Normal Flow",
    previousPhase: "Normal Flow",
    sensors: DEFAULT_SENSORS,
    leadSensor: "left",
    leadTally: DEFAULT_LEAD_TALLY,
    alerts: [],
    history: [],
    role: "Operator",
    activeTab: "landing",
    roiBox: undefined,
    rawOccupiedPixels: undefined,
    totalRoiPixels: undefined,
    emailAlertsEnabled: alertPreferences.emailAlertsEnabled,
    soundAlertsEnabled: alertPreferences.soundAlertsEnabled,

    setConnected: (status) => set({ isConnected: status }),

    updateFromSocket: (data) => set((state) => {
        const newHistory = [
            ...state.history,
            {
                time: new Date(data.timestamp).toLocaleTimeString([], { hour12: false }),
                choke: data.choke_percent,
                left: data.sensors?.left ?? state.sensors.left,
                right: data.sensors?.right ?? state.sensors.right,
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

        // Check for escalation transition for sound alert
        const isEscalated = data.phase === "Escalated — Manual Intervention Required"
        const wasEscalated = state.currentPhase === "Escalated — Manual Intervention Required"
        
        if (isEscalated && !wasEscalated && state.soundAlertsEnabled) {
            // Trigger sound alert
            const utterance = new SpeechSynthesisUtterance(
                `Alert. Chute CH-01 escalated. Manual intervention required. Choke level ${Math.round(data.choke_percent)} percent.`
            )
            utterance.rate = 1.0
            speechSynthesis.speak(utterance)
        }

        return {
            currentChoke: data.choke_percent,
            currentPhase: data.phase,
            previousPhase: state.currentPhase,
            sensors: data.sensors ?? state.sensors,
            leadSensor: data.lead_sensor ?? state.leadSensor,
            leadTally: data.lead_tally ?? state.leadTally,
            history: newHistory,
            alerts: newAlerts,
            roiBox: data.roi_box,
            rawOccupiedPixels: data.raw_occupied_pixels,
            totalRoiPixels: data.total_roi_pixels,
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
