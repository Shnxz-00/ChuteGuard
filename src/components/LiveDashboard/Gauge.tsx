import { motion } from "framer-motion"

export function Gauge({ value, phase, label }: { value: number, phase: string, label?: string }) {
    const radius = 100
    const circumference = Math.PI * radius
    // Scale value between 0 (left) and 100 (right)
    const strokeDashoffset = circumference - (value / 100) * circumference

    let colorVar = "var(--color-status-normal)" // Default normal

    if (value >= 70 || phase.includes("Escalated")) {
        colorVar = "var(--color-status-danger)"
    } else if (value >= 50 || phase.includes("Buildup")) {
        colorVar = "var(--color-status-warning)"
    }

    // Custom transition settings to make it smooth but mechanical
    const springTransition = {
        type: "spring" as const,
        stiffness: 40,
        damping: 10,
        mass: 1
    }

    return (
        <div className="relative flex items-center justify-center w-full max-w-sm mx-auto">
            <svg className="w-full text-[var(--color-border-color)]" viewBox="0 0 240 140" preserveAspectRatio="xMidYMid meet">
                {/* Background Arc */}
                <path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    strokeLinecap="round"
                />
                {/* Animated Value Arc */}
                <motion.path
                    d="M 20 120 A 100 100 0 0 1 220 120"
                    fill="none"
                    stroke={colorVar}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={springTransition}
                />

                {/* Tick Marks for context */}
                <text x="20" y="135" className="text-[10px] font-mono fill-[var(--color-text-muted)] text-center">0%</text>
                <text x="120" y="15" className="text-[10px] font-mono fill-[var(--color-text-muted)] text-center" textAnchor="middle">50%</text>
                <text x="220" y="135" className="text-[10px] font-mono fill-[var(--color-text-muted)] text-center" textAnchor="end">100%</text>
            </svg>

            {/* Central Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                <motion.span
                    className="text-6xl font-mono font-bold tracking-tighter"
                    style={{ color: colorVar }}
                >
                    {value.toFixed(1)}
                </motion.span>
                <span className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1 font-semibold">{label || "Choke %"}</span>
            </div>
        </div>
    )
}
