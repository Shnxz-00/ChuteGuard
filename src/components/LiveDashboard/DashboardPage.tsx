import { useStore } from "../../lib/store"
import { sendManualPulse } from "../../lib/socket"
import { Gauge } from "./Gauge"
import { AlertFeed } from "./AlertFeed"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Shield, Zap, ActivitySquare, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

// ── Compact mini-sensor card ──────────────────────────────────────────────────
function SensorCard({ label, choke, isLead }: { label: string; choke: number; isLead: boolean }) {
    const color =
        choke >= 70 ? "var(--color-status-danger)" :
            choke >= 50 ? "var(--color-status-warning)" :
                "var(--color-status-normal)"

    return (
        <div
            className="flex-1 rounded-lg border p-3 flex flex-col gap-1 transition-all duration-300"
            style={{ borderColor: isLead ? color : "var(--color-border-color)", background: "var(--color-background)" }}
        >
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-muted)]">
                    {label}
                </span>
                {isLead && (
                    <span className="text-[9px] font-mono px-1 rounded" style={{ background: color + "30", color }}>LEAD</span>
                )}
            </div>
            <div className="font-mono font-bold text-xl" style={{ color }}>
                {choke.toFixed(1)}<span className="text-xs font-normal text-[var(--color-text-muted)]">%</span>
            </div>
            {/* Mini bar */}
            <div className="w-full h-1.5 rounded-full bg-[var(--color-border-color)] overflow-hidden">
                <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    animate={{ width: `${Math.min(100, choke)}%` }}
                    transition={{ duration: 0.6 }}
                />
            </div>
        </div>
    )
}

// ── Main dashboard page ──────────────────────────────────────────────────────
export function DashboardPage() {
    const { currentPhase, sensors, leadSensor, role } = useStore()

    const isEscalated = currentPhase.includes("Escalated")
    const isBuildup = currentPhase.includes("Buildup")

    let phaseColor = "normal" as any
    let PhaseIcon = ActivitySquare
    if (isEscalated) { phaseColor = "danger"; PhaseIcon = Shield }
    else if (isBuildup) { phaseColor = "warning"; PhaseIcon = AlertTriangle }

    const sensorLabels: Record<string, string> = {
        left: "Left Slant",
        right: "Right Slant",
    }

    return (
        <div className="h-full flex flex-col space-y-5 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Live Dashboard</h2>
                    <p className="text-[var(--color-text-muted)] font-mono text-sm mt-1">Conveyor Discharge Chute CH-01</p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="default" className="text-xs uppercase font-mono px-3 py-1 bg-[var(--color-background)]">
                        Sensor: Active
                    </Badge>
                    <Badge variant={phaseColor} className="text-lg font-mono px-4 py-1.5 flex items-center gap-2">
                        <PhaseIcon className="w-4 h-4" />
                        {currentPhase}
                    </Badge>
                </div>
            </div>

            {/* Two-sensor mini-cards */}
            <div className="flex gap-3">
                {Object.entries(sensorLabels).map(([key, label]) => (
                    <SensorCard
                        key={key}
                        label={label}
                        choke={sensors[key as keyof typeof sensors]}
                        isLead={leadSensor === key}
                    />
                ))}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Left — Controls */}
                <div className="flex flex-col gap-6">
                    <Card className="flex-1 bg-[var(--color-panel)] border-[var(--color-border-color)]">
                        <CardHeader>
                            <CardTitle className="text-[var(--color-text-primary)]">System Control</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm font-medium mb-1">
                                    <span className="text-[var(--color-text-muted)]">Manual Assist</span>
                                    {role === "Supervisor" && <Badge>Supervisor</Badge>}
                                </div>
                                <div className="relative group">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-12 text-sm font-semibold border-[var(--color-border-color)] hover:border-[var(--color-status-warning)] transition-colors"
                                        disabled={isEscalated}
                                        onClick={sendManualPulse}
                                    >
                                        <Zap className="mr-2 h-4 w-4 text-[var(--color-status-warning)]" />
                                        Trigger Vibro-Assist
                                    </Button>
                                    {isEscalated && (
                                        <div className="absolute -top-14 left-0 w-full bg-[var(--color-border-color)] text-white text-xs p-2 rounded shadow-lg border border-[var(--color-status-danger)]/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                                            Disabled: Escalated condition — automated pulse locked out to protect liner. Manual inspection required.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[var(--color-background)] p-4 rounded-md border border-[var(--color-border-color)] space-y-3">
                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)] font-medium">
                                    <Shield className="w-4 h-4 text-[var(--color-status-normal)]" /> Safety Internals
                                </div>
                                {[
                                    ["Pulse Cap", "100 ms"],
                                    ["Belt Speed", "Read-Only"],
                                    ["Vibro Limit", "3×/min"],
                                    ["Thresholds", "50% / 70%"],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-xs font-mono text-[var(--color-text-muted)]">
                                        <span>{k}</span>
                                        <span className="text-white">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Center — Primary Gauge */}
                <Card className="flex-col justify-center bg-[#0d1217] border-[var(--color-border-color)] flex shadow-inner relative overflow-hidden">
                    <AnimatePresence>
                        {isEscalated && (
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
                            Chute % Levels
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-start flex-1 z-10 overflow-y-auto w-full pt-4 pb-6 gap-8 min-h-0">
                        <Gauge value={sensors.left} phase={currentPhase} label="Left Chute" />
                        <Gauge value={sensors.right} phase={currentPhase} label="Right Chute" />
                    </CardContent>
                </Card>

                {/* Right — Alerts */}
                <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)] flex flex-col min-h-0">
                    <CardContent className="p-0 flex-1 overflow-hidden">
                        <AlertFeed />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
