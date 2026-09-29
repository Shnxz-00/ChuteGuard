import { useStore } from "../../lib/store"
import { Gauge } from "./Gauge"
import { AlertFeed } from "./AlertFeed"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { ActivitySquare, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useVideoSyncedChoke } from "../../hooks/useVideoSyncedChoke"
import * as React from "react"

// ── Main dashboard page ──────────────────────────────────────────────────────
export function DashboardPage() {
    const { currentPhase, currentChoke } = useStore()
    const primaryVideoRef = React.useRef<HTMLVideoElement>(null)
    const secondaryVideoRef = React.useRef<HTMLVideoElement>(null)

    // Use the new video-synced choke hook
    useVideoSyncedChoke(primaryVideoRef, "/chv1_readings.json")
    useVideoSyncedChoke(secondaryVideoRef, "/chv2_readings.json")

    const isMaxChoking = currentPhase.includes("Alert")
    const isMinimalChoking = currentPhase.includes("Minimal Choking")

    let phaseColor = "normal" as any
    let PhaseIcon = ActivitySquare
    if (isMaxChoking) { phaseColor = "danger"; PhaseIcon = AlertTriangle }
    else if (isMinimalChoking) { phaseColor = "warning"; PhaseIcon = AlertTriangle }

    return (
        <div className="h-full flex flex-col space-y-5 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Live Dashboard</h2>
                    <p className="text-[var(--color-text-muted)] font-mono text-sm mt-1">Conveyor Discharge Chute CH-01</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={phaseColor} className="text-lg font-mono px-4 py-1.5 flex items-center gap-2">
                        <PhaseIcon className="w-4 h-4" />
                        {currentPhase}
                    </Badge>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left Column — Primary Video + Gauge */}
                <div className="flex flex-col gap-6">
                    {/* Primary Video Panel */}
                    <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)]">
                        <CardHeader>
                            <CardTitle className="text-[var(--color-text-primary)]">Primary Detection Feed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative bg-[#101715] rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                <video
                                    ref={primaryVideoRef}
                                    src="/chv1.mp4"
                                    controls
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                                    Primary Detection Feed (chv1.mp4)
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Gauge */}
                    <Card className="flex-col justify-center bg-[#0d1217] border-[var(--color-border-color)] flex shadow-inner relative overflow-hidden">
                        <AnimatePresence>
                            {isMaxChoking && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0.08, 0.22, 0.08] }}
                                    transition={{ duration: 1.8, repeat: Infinity }}
                                    className="absolute inset-0 bg-red-500/10 pointer-events-none"
                                />
                            )}
                        </AnimatePresence>
                        <CardHeader className="text-center pb-0 z-10 shrink-0">
                            <CardTitle className="text-2xl text-[var(--color-text-muted)] font-mono font-medium">
                                Chute Choke %
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-start flex-1 z-10 overflow-y-auto w-full pt-4 pb-6 gap-8 min-h-0">
                            <Gauge value={currentChoke} phase={currentPhase} label="Choke %" />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column — Secondary Video + Alert Feed */}
                <div className="flex flex-col gap-6">
                    {/* Secondary Video Panel */}
                    <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)]">
                        <CardHeader>
                            <CardTitle className="text-[var(--color-text-primary)]">Detection Process Walkthrough</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="relative bg-[#101715] rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                <video
                                    ref={secondaryVideoRef}
                                    src="/chv2.mp4"
                                    controls
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                                    Detection Process (chv2.mp4)
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Alert Feed */}
                    <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)] flex flex-col min-h-0 flex-1">
                        <CardHeader>
                            <CardTitle className="text-[var(--color-text-primary)]">Alert Feed</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden">
                            <AlertFeed />
                        </CardContent>
                    </Card>

                    {/* CV Analysis Data */}
                    <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)] opacity-90">
                        <CardHeader>
                            <CardTitle className="text-[var(--color-text-muted)] text-sm">CV Analysis Data</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-[var(--color-text-muted)]">Current Choke %:</span>
                                <span className="font-mono text-xs text-[var(--color-status-normal)]">
                                    {currentChoke.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-[var(--color-text-muted)]">Warning Threshold:</span>
                                <span className="font-mono text-xs text-[var(--color-status-warning)]">
                                    20%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-[var(--color-text-muted)]">Alert Threshold:</span>
                                <span className="font-mono text-xs text-[var(--color-status-danger)]">
                                    50%
                                </span>
                            </div>
                            <div className="pt-2 border-t border-[var(--color-border-color)]">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--color-text-muted)]">Current Phase:</span>
                                    <span className="font-mono text-xs text-[var(--color-status-normal)]">
                                        {currentPhase}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-[var(--color-border-color)]">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[var(--color-text-muted)]">Camera health:</span>
                                    <span className="font-mono text-xs text-[var(--color-status-normal)]">
                                        Stable
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
