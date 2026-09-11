import { useStore } from "../../lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import type { LeadTally } from "../../lib/store"
import {
    BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer,
    Tooltip as RechartsTooltip, CartesianGrid
} from "recharts"

const SENSOR_COLORS: Record<string, string> = {
    "Left Slant": "var(--color-status-warning)",
    "Right Slant": "var(--color-status-normal)",
}

export function SensorInfluencePanel() {
    const { leadTally } = useStore()

    const total = (leadTally.left + leadTally.right) || 1

    const data = [
        { name: "Left Slant", leads: leadTally.left, pct: Math.round(leadTally.left / total * 100) },
        { name: "Right Slant", leads: leadTally.right, pct: Math.round(leadTally.right / total * 100) },
    ]

    const customTooltipStyle = {
        backgroundColor: "var(--color-panel)",
        borderColor: "var(--color-border-color)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-mono)",
        fontSize: 12,
    }

    return (
        <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)]">
            <CardHeader>
                <CardTitle className="text-[var(--color-text-primary)]">Sensor Influence — Lead Trigger Tally</CardTitle>
                <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
                    Which sensor first crossed warning threshold in each buildup cycle (rolling last 20)
                </p>
            </CardHeader>
            <CardContent className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-color)" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, 20]}
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                            label={{ value: "lead count (of 20)", position: "insideBottomRight", offset: -4, fill: "var(--color-text-muted)", fontSize: 10 }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={80}
                            stroke="var(--color-text-muted)"
                            tick={{ fontSize: 12, fontFamily: "var(--font-body)" }}
                        />
                        <RechartsTooltip
                            contentStyle={customTooltipStyle}
                            formatter={(value: any, _: any, props: any) => [`${value} (${props.payload.pct}%)`, "Lead cycles"]}
                        />
                        <Bar dataKey="leads" radius={[0, 4, 4, 0]}>
                            {data.map((entry) => (
                                <Cell key={entry.name} fill={SENSOR_COLORS[entry.name]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
