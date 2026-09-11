import { useStore } from "../../lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { SensorInfluencePanel } from "./SensorInfluencePanel"
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend
} from "recharts"

const SENSOR_COLORS = {
    left: "var(--color-status-warning)",
    right: "var(--color-status-normal)",
}

export function TrendsPage() {
    const { history } = useStore()
    const chartData = history.length > 0 ? history : [{ time: "—", choke: 0, left: 0, right: 0 }]

    const roiData = [
        { metric: "Downtime (hrs/day)", "Before ChuteGuard": 2.0, "With ChuteGuard": 0.9 },
        { metric: "Manual Labor (hrs/day)", "Before ChuteGuard": 4.0, "With ChuteGuard": 1.6 },
    ]

    const tooltipStyle = {
        backgroundColor: "var(--color-panel)",
        borderColor: "var(--color-border-color)",
        color: "var(--color-text-primary)",
    }

    return (
        <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-heading font-bold text-white tracking-tight">Trends & ROI</h2>
                <p className="text-[var(--color-text-muted)] font-mono text-sm mt-1">Historical Choke % and Performance Impact</p>
            </div>

            {/* Combined timeline */}
            <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)]">
                <CardHeader>
                    <CardTitle className="text-[var(--color-text-primary)]">Live Session Timeline — All Sensors</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-color)" vertical={false} />
                            <XAxis
                                dataKey="time"
                                stroke="var(--color-text-muted)"
                                tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                                tickMargin={10}
                            />
                            <YAxis
                                stroke="var(--color-text-muted)"
                                tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                                domain={[0, 100]}
                            />
                            <RechartsTooltip
                                contentStyle={tooltipStyle}
                                itemStyle={{ fontFamily: "var(--font-mono)" }}
                                labelStyle={{ color: "var(--color-text-muted)", marginBottom: 4 }}
                            />
                            <ReferenceLine y={50} stroke="var(--color-status-warning)" strokeDasharray="3 3"
                                label={{ position: "insideTopLeft", fill: "var(--color-status-warning)", fontSize: 11, value: "Warning (50%)" }} />
                            <ReferenceLine y={70} stroke="var(--color-status-danger)" strokeDasharray="3 3"
                                label={{ position: "insideTopLeft", fill: "var(--color-status-danger)", fontSize: 11, value: "Action (70%)" }} />

                            {/* Combined choke — escalation dots */}
                            <Line
                                type="monotone" dataKey="choke" name="Combined"
                                stroke="var(--color-text-primary)" strokeWidth={2.5}
                                dot={(props: any) => {
                                    const { cx, cy, payload, key } = props
                                    if (payload?.choke >= 70) return (
                                        <g key={key}>
                                            <circle cx={cx} cy={cy} r={5} fill="var(--color-status-danger)" />
                                            <circle cx={cx} cy={cy} r={9} fill="none" stroke="var(--color-status-danger)" strokeWidth={1} opacity={0.4} />
                                        </g>
                                    )
                                    return <g key={key} />
                                }}
                                activeDot={{ r: 4 }} isAnimationActive={false}
                            />

                            {/* Per-sensor lines */}
                            <Line type="monotone" dataKey="left" name="Left Slant" stroke={SENSOR_COLORS.left} strokeWidth={1.2} dot={false} strokeDasharray="4 2" isAnimationActive={false} />
                            <Line type="monotone" dataKey="right" name="Right Slant" stroke={SENSOR_COLORS.right} strokeWidth={1.2} dot={false} strokeDasharray="4 2" isAnimationActive={false} />

                            <Legend wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-mono)", paddingTop: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Sensor Influence Panel */}
            <SensorInfluencePanel />

            {/* ROI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)]">
                    <CardHeader>
                        <CardTitle className="text-[var(--color-text-primary)]">Projected ROI</CardTitle>
                    </CardHeader>
                    <CardContent className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={roiData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-color)" vertical={false} />
                                <XAxis dataKey="metric" stroke="var(--color-text-muted)" tick={{ fontSize: 12, fontFamily: "var(--font-body)" }} />
                                <YAxis stroke="var(--color-text-muted)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                                <RechartsTooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-border-color)", opacity: 0.2 }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                                <Bar dataKey="Before ChuteGuard" fill="var(--color-status-danger)" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="With ChuteGuard" fill="var(--color-status-normal)" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)] flex flex-col justify-center p-6">
                    <h3 className="font-heading font-semibold text-lg text-white mb-4">Impact Summary</h3>
                    {[
                        ["Annual Downtime Saved", "~400 hrs"],
                        ["Manual Labor Reduced", "~60%"],
                        ["Vibro-Assist Response", "< 1 s"],
                        ["Liner Wear Cycles", "+3× expected life"],
                    ].map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center py-2 border-b border-[var(--color-border-color)] last:border-0">
                            <span className="text-sm text-[var(--color-text-muted)] font-mono">{k}</span>
                            <span className="text-sm font-semibold text-white font-mono">{v}</span>
                        </div>
                    ))}
                </Card>
            </div>
        </div>
    )
}
