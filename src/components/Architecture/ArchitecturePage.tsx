import { Canvas } from "@react-three/fiber"
import { OrbitControls, Html } from "@react-three/drei"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Network, Settings, AlertTriangle, Droplets } from "lucide-react"

function ChuteModel() {
    return (
        <group position={[0, -1, 0]}>
            {/* Conveyor Belt Feed (Top) */}
            <mesh position={[0, 4, 0]}>
                <boxGeometry args={[3, 0.5, 4]} />
                <meshStandardMaterial color="#1a2530" roughness={0.8} />
            </mesh>

            {/* Chute Funnel — teal-tinted semi-transparent with wireframe overlay */}
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[2, 1, 4, 32]} />
                <meshStandardMaterial color="#0b4a40" roughness={0.7} metalness={0.2} transparent opacity={0.45} />
            </mesh>
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[2.01, 1.01, 4, 20]} />
                <meshBasicMaterial color="#2fd9a8" wireframe transparent opacity={0.18} />
            </mesh>

            {/* Discharge tube (bottom) */}
            <mesh position={[0, -1, 0]}>
                <cylinderGeometry args={[1, 1, 1.2, 24]} />
                <meshStandardMaterial color="#0b4a40" transparent opacity={0.45} />
            </mesh>
            <mesh position={[0, -1, 0]}>
                <cylinderGeometry args={[1.01, 1.01, 1.2, 12]} />
                <meshBasicMaterial color="#2fd9a8" wireframe transparent opacity={0.18} />
            </mesh>

            {/* ── Sensor Markers (2-sensor architecture) ── */}
            {/* Left Slant — lower-left on the slanting funnel wall */}
            <Marker
                position={[-1.6, 0.5, 0]}
                label="Left Slant"
                description="Lower-left wall · Ultrasonic + load cell"
                color="var(--color-status-warning)"
            />
            {/* Right Slant — lower-right on the slanting funnel wall */}
            <Marker
                position={[1.6, 0.5, 0]}
                label="Right Slant"
                description="Lower-right wall · Ultrasonic + load cell"
                color="var(--color-status-normal)"
            />
            {/* Vibrator mount */}
            <Marker
                position={[0, -0.5, 1.1]}
                label="Vibrator Mount"
                description="Pneumatic vibro-assist actuator"
                color="var(--color-status-danger)"
            />
        </group>
    )
}

function Marker({ position, label, description, color = "var(--color-status-normal)" }: {
    position: [number, number, number]
    label: string
    description: string
    color?: string
}) {
    return (
        <Html position={position} center className="pointer-events-none">
            <div className="flex flex-col items-center group relative cursor-pointer pointer-events-auto">
                <div
                    className="w-3 h-3 rounded-full border-2 border-white animate-pulse"
                    style={{ backgroundColor: color }}
                />
                <div className="absolute top-5 w-40 bg-[var(--color-background)] border border-[var(--color-border-color)] p-2 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg text-center font-mono">
                    <strong className="text-[var(--color-text-primary)] block mb-1">{label}</strong>
                    <span className="text-[var(--color-text-muted)] text-[10px] whitespace-normal leading-tight">{description}</span>
                </div>
            </div>
        </Html>
    )
}

export function ArchitecturePage() {
    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Architecture & Safety</h2>
                <p className="text-[var(--color-text-muted)] font-mono text-sm mt-1">System Topology and Hard-Coded Safeguards</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
                {/* 3D Diagram */}
                <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)] h-[500px] flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-[var(--color-text-primary)] text-sm uppercase tracking-widest text-center">
                            Interactive Sensor Map — 2-Sensor Layout
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 w-full bg-[#0a0d10] rounded-b-lg overflow-hidden relative cursor-move">
                        <div className="absolute top-4 left-4 z-10 text-xs font-mono text-[var(--color-text-muted)]">
                            &gt; Drag to rotate<br />&gt; Scroll to zoom
                        </div>
                        <Canvas camera={{ position: [5, 4, 5], fov: 50 }}>
                            <ambientLight intensity={1.2} />
                            <pointLight position={[10, 10, 10]} intensity={2.0} color="#ffffff" />
                            <pointLight position={[-10, -10, -10]} intensity={1.0} color="#2fd9a8" />
                            <directionalLight position={[0, 5, 2]} intensity={1.5} />
                            <ChuteModel />
                            <OrbitControls enablePan enableZoom />
                        </Canvas>
                    </CardContent>
                </Card>

                {/* Safety Docs */}
                <div className="flex flex-col gap-4">
                    <Card className="bg-[var(--color-panel)] border-[var(--color-status-normal)] border-t-[3px]">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <Network className="w-8 h-8 text-[var(--color-status-normal)] shrink-0" />
                                <div>
                                    <h4 className="font-heading font-semibold text-lg text-white mb-2">Local Edge Controller</h4>
                                    <p className="text-sm text-[var(--color-text-muted)] font-mono leading-relaxed">
                                        The sense → quantify → alert loop runs entirely on the local PLC edge node. The web dashboard is read-only visibility — if network access drops, the physical safety loop continues operating independently.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[var(--color-panel)] border-[var(--color-status-warning)] border-t-[3px]">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <Settings className="w-8 h-8 text-[var(--color-status-warning)] shrink-0" />
                                <div>
                                    <h4 className="font-heading font-semibold text-lg text-white mb-2">PTFE Liner Protection</h4>
                                    <p className="text-sm text-[var(--color-text-muted)] font-mono leading-relaxed">
                                        Vibro-assist is hard-capped at 100 ms per burst and cannot be triggered continuously. Protects the non-stick liner from premature fatigue. Escalated states lock out all automated pulses.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[var(--color-panel)] border-[var(--color-status-danger)] border-t-[3px]">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <AlertTriangle className="w-8 h-8 text-[var(--color-status-danger)] shrink-0" />
                                <div>
                                    <h4 className="font-heading font-semibold text-lg text-white mb-2">Escalation Boundary</h4>
                                    <p className="text-sm text-[var(--color-text-muted)] font-mono leading-relaxed">
                                        If combined choke exceeds 70%, all automation is suspended and a manual intervention workflow is forced. Belt speed monitoring is strictly read-only — this system never controls primary drive motors.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[var(--color-panel)] border-[#9b8aff]/60 border-t-[3px]">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <Droplets className="w-8 h-8 shrink-0" style={{ color: "#9b8aff" }} />
                                <div>
                                    <h4 className="font-heading font-semibold text-lg text-white mb-2">Humidity-Modulated Simulation</h4>
                                    <p className="text-sm text-[var(--color-text-muted)] font-mono leading-relaxed">
                                        Buildup simulation rate is scaled by real historical humidity data for the Chhattisgarh region (IMD Raipur station), reflecting the documented link between elevated moisture and coal/limestone adhesion in discharge chutes. Peak monsoon months (Jul–Aug, 86–88% RH) see up to 2.3× faster buildup.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
