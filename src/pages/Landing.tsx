import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LayoutDashboard, LineChart, Box, ChevronRight, Eye } from "lucide-react"
import { useStore } from "../lib/store"
import { Gauge } from "../components/LiveDashboard/Gauge"

// ── Stage 1: Boot Log ────────────────────────────────────────────────────────
const BOOT_LINES = [
    "INITIALIZING CHUTEGUARD...",
    "SENSORS: LEFT SLANT ✓ RIGHT SLANT ✓",
    "EDGE CONTROLLER: ONLINE",
    "CHOKE INDEX: NOMINAL"
]

function BootLog({ onComplete }: { onComplete: () => void }) {
    const [lines, setLines] = useState<string[]>([])
    const hasRunRef = useRef(false)

    useEffect(() => {
        if (hasRunRef.current) return
        hasRunRef.current = true

        let isCancelled = false
        const typeLines = async () => {
            for (let i = 0; i < BOOT_LINES.length; i++) {
                if (isCancelled) return
                await new Promise(r => setTimeout(r, i === 0 ? 300 : 800))
                if (isCancelled) return
                setLines(prev => [...prev, BOOT_LINES[i]])
            }
            // After all lines print, wait 1s then proceed
            await new Promise(r => setTimeout(r, 1200))
            if (!isCancelled) onComplete()
        }
        typeLines()
        return () => { isCancelled = true }
    }, [])

    return (
        <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center h-full w-full relative"
        >
            <div className="font-mono text-sm sm:text-base text-[var(--color-status-normal)] w-full max-w-xl px-4">
                {lines.map((line, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        {line}
                    </motion.div>
                ))}
                {/* Blinking cursor */}
                <motion.div
                    animate={{ opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="inline-block w-2 bg-[var(--color-status-normal)] ml-1 h-[1em] align-middle mt-1"
                />
            </div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={onComplete}
                className="absolute bottom-8 right-8 text-xs font-mono text-[var(--color-text-muted)] hover:text-white transition-colors flex items-center gap-1"
            >
                Skip sequence <ChevronRight className="w-3 h-3" />
            </motion.button>
        </motion.div>
    )
}

// ── Stage 2: Central Gauge ───────────────────────────────────────────────────
function LiveGaugeStage({ onComplete }: { onComplete: () => void }) {
    const { currentPhase, sensors } = useStore()

    useEffect(() => {
        const timer = setTimeout(onComplete, 2500)
        return () => clearTimeout(timer)
    }, [onComplete])

    // We can use the max of sensors since the original dashboard uses currentChoke.
    // The instructions say "reuse the component... tracking live data".
    const chokeValue = Math.max(sensors.left, sensors.right)

    return (
        <motion.div
            key="gauge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center justify-center h-full w-full"
        >
            <Gauge value={chokeValue} phase={currentPhase} />
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 font-mono text-sm text-[var(--color-text-muted)] tracking-wider"
            >
                Real-time chute health, from two sensor points.
            </motion.p>
        </motion.div>
    )
}

// ── Stage 3: Navigation Cards ────────────────────────────────────────────────
function NavigationCards() {
    const { setActiveTab, isConnected } = useStore()

    const cards = [
        { id: "dashboard" as const, title: "Live Dashboard", desc: "See it live", icon: LayoutDashboard },
        { id: "live-analysis" as const, title: "Live Analysis", desc: "Watch the CV pipeline", icon: Eye },
        { id: "trends" as const, title: "Trends & ROI", desc: "The numbers", icon: LineChart },
        { id: "architecture" as const, title: "Architecture & Safety", desc: "How it's built to fail safe", icon: Box },
    ]

    const containerVars = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    }

    const itemVars = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 20 } }
    }

    return (
        <motion.div
            key="cards"
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center justify-center h-full w-full p-4 relative"
        >
            {/* Background Image */}
            <img
                src="/gpil.jpg"
                alt="Industrial plant background"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                    filter: 'grayscale(85%) brightness(0.55) contrast(1.1) sepia(20%) hue-rotate(100deg) saturate(180%)',
                    opacity: 0.35,
                }}
            />

            {/* Dark Scrim Gradient */}
            <div
                className="absolute inset-0"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    background: 'radial-gradient(ellipse at center, rgba(10, 13, 16, 0.4) 0%, rgba(10, 13, 16, 0.85) 60%, rgba(10, 13, 16, 0.98) 100%)',
                }}
            />

            {/* Animated Background Texture */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-px h-12 bg-[var(--color-status-normal)]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `-10%`,
                            opacity: 0.05 + Math.random() * 0.05,
                        }}
                        animate={{
                            top: ["-10%", "110%"],
                        }}
                        transition={{
                            duration: 8 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "linear"
                        }}
                    />
                ))}
            </div>

            {/* Live Status Strip */}
            <div className="relative mb-8" style={{ zIndex: 3 }}>
                <div className="flex items-center gap-2 bg-[var(--color-panel)] border border-[var(--color-border-color)] rounded-full px-4 py-2">
                    <motion.div
                        className="w-2 h-2 rounded-full bg-[var(--color-status-normal)]"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <span className="text-xs font-mono text-[var(--color-status-normal)] uppercase tracking-wider">
                        SENSOR: {isConnected ? "ACTIVE" : "OFFLINE"}
                    </span>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative mb-12 text-center" style={{ zIndex: 3 }}>
                {/* Optional Animated Gauge Arc Fragment */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-[600px] h-[300px] opacity-5" viewBox="0 0 600 300">
                        <motion.path
                            d="M 50 250 A 250 250 0 0 1 550 250"
                            fill="none"
                            stroke="var(--color-status-normal)"
                            strokeWidth="8"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />
                    </svg>
                </div>

                <p className="text-xs font-mono text-[var(--color-status-normal)] uppercase tracking-[0.2em] mb-3">
                    System Nominal
                </p>
                <h1 className="text-5xl md:text-6xl font-heading font-bold text-white tracking-tight mb-4">
                    ChuteGuard
                </h1>
                <p className="text-lg md:text-xl font-body font-normal text-[var(--color-text-muted)] max-w-2xl mx-auto">
                    Industrial Chute Blockage Detection using CV & AI
                </p>
            </div>

            {/* Card Grid */}
            <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl w-full" style={{ zIndex: 3 }}>
                {cards.map((card) => (
                    <motion.button
                        key={card.id}
                        variants={itemVars}
                        whileHover={{ 
                            y: -5, 
                            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)"
                        }}
                        onClick={() => setActiveTab(card.id)}
                        className="bg-[var(--color-panel)] border border-[var(--color-border-color)] rounded-xl p-6 flex flex-col items-start gap-4 text-left transition-all duration-300 group relative overflow-hidden"
                    >
                        {/* Top border accent on hover */}
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[var(--color-status-normal)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                        <motion.div
                            className="bg-[var(--color-background)] p-3 rounded-lg border border-[var(--color-border-color)] group-hover:border-[var(--color-status-normal)]/50 transition-colors"
                            whileHover={{ scale: 1.05 }}
                        >
                            <card.icon className="w-6 h-6 text-white group-hover:text-[var(--color-status-normal)] transition-colors" />
                        </motion.div>
                        <div>
                            <h3 className="font-heading font-semibold text-lg text-white mb-1">{card.title}</h3>
                            <p className="text-sm font-mono text-[var(--color-text-muted)] flex items-center gap-1 group-hover:text-white/80 transition-colors">
                                {card.desc} <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -ml-2 group-hover:ml-0" />
                            </p>
                        </div>
                    </motion.button>
                ))}
            </div>

            {/* Photo Credit */}
            <div className="relative mt-8" style={{ zIndex: 3 }}>
                <p className="text-xs text-[var(--color-text-muted)] font-mono">
                    Photo: Godawari Power & Ispat plant, Raipur
                </p>
            </div>
        </motion.div>
    )
}

// ── Main Controller ──────────────────────────────────────────────────────────
export function LandingPage() {
    const [stage, setStage] = useState<1 | 2 | 3>(() => {
        const hasPlayed = sessionStorage.getItem("boot_played")
        return hasPlayed ? 3 : 1
    })

    const advanceToCards = () => {
        sessionStorage.setItem("boot_played", "true")
        setStage(3)
    }

    return (
        <div className="bg-[var(--color-background)] w-full h-screen overflow-hidden text-white flex items-center justify-center">
            <AnimatePresence mode="wait">
                {stage === 1 && (
                    <BootLog onComplete={() => setStage(2)} />
                )}
                {stage === 2 && (
                    <LiveGaugeStage onComplete={advanceToCards} />
                )}
                {stage === 3 && (
                    <NavigationCards />
                )}
            </AnimatePresence>
        </div>
    )
}
