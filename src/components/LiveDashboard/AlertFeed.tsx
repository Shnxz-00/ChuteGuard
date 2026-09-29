import { useStore, type AlertEvent } from "../../lib/store"
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, Zap, ShieldAlert } from "lucide-react"

export function AlertFeed() {
    const { alerts } = useStore()

    return (
        <div className="h-full overflow-hidden flex flex-col">
            <h3 className="font-heading font-semibold text-lg text-white mb-4 px-1">Alert Feed</h3>
            <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-3">
                {alerts.length === 0 && (
                    <div className="text-sm text-[var(--color-text-muted)] p-4 text-center font-mono">No recent alerts. Monitoring...</div>
                )}
                <AnimatePresence initial={false}>
                    {alerts.map((alert, idx) => (
                        <AlertItem key={alert.timestamp + idx} alert={alert} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}

function AlertItem({ alert }: { alert: AlertEvent }) {
    const isEscalation = alert.action.toLowerCase().includes("escalat")
    const isVibro = alert.action.toLowerCase().includes("vibro-assist") || alert.action.toLowerCase().includes("pulse")

    let icon = <AlertCircle className="w-5 h-5 text-gray-400" />
    let borderColor = "border-[var(--color-border-color)]"

    if (isEscalation) {
        icon = <ShieldAlert className="w-5 h-5 text-[var(--color-status-danger)]" />
        borderColor = "border-[var(--color-status-danger)]"
    } else if (isVibro) {
        icon = <Zap className="w-5 h-5 text-[var(--color-status-warning)]" />
        borderColor = "border-[var(--color-status-warning)]"
    } else {
        // e.g. Manual Cleared
        icon = <AlertCircle className="w-5 h-5 text-[var(--color-status-normal)]" />
        borderColor = "border-[var(--color-status-normal)]"
    }

    const timeStr = new Date(alert.timestamp).toLocaleTimeString([], { hour12: false })

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className={`bg-[var(--color-background)] border-l-[3px] p-4 rounded-r-md ${borderColor}`}
        >
            <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">{icon}</div>
                <div className="w-full">
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-heading font-semibold text-white/90 text-sm leading-tight max-w-[200px]">
                            {alert.action}
                        </span>
                        <span className="font-mono text-xs text-[var(--color-text-muted)] whitespace-nowrap">
                            {timeStr}
                        </span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <span className="text-[11px] text-[var(--color-text-muted)]">Chute ID: CH-01</span>
                        {alert.choke_percent && (
                            <span className="font-mono text-xs font-semibold bg-[var(--color-panel)] px-2 py-0.5 rounded border border-[var(--color-border-color)] text-[var(--color-text-primary)]">
                                Choke: {alert.choke_percent.toFixed(1)}%
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
