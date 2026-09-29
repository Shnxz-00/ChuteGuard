import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { CheckCircle, AlertTriangle, User, Activity } from "lucide-react"

export function HowItWorksPage() {
    return (
        <div className="h-full w-full p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white tracking-tight mb-2">How It Works</h1>
                <p className="text-sm text-[var(--color-text-muted)]">
                    Understanding the detection process and manual intervention workflow
                </p>
            </div>

            <div className="space-y-8">
                {/* Detection Process Walkthrough */}
                <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)]">
                    <CardHeader>
                        <CardTitle className="text-[var(--color-text-primary)]">Detection Process Walkthrough</CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                            Real-time choke detection and alert system workflow
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Video Player */}
                            <div className="bg-[#101715] rounded-lg overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
                                <video
                                    src="/chv2.mp4"
                                    controls
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                                    Detection Process Walkthrough
                                </div>
                            </div>

                            {/* 4-Step Process */}
                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border-color)]">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-status-warning)]/20 flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-[var(--color-status-warning)]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">1. Choke Detected</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            The model flags rising material buildup in real time using computer vision analysis
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border-color)]">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-status-danger)]/20 flex items-center justify-center">
                                            <AlertTriangle className="w-5 h-5 text-[var(--color-status-danger)]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">2. Alert Raised</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            The dashboard and alert feed fire the moment the threshold is crossed (20% warning, 50% alert)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border-color)]">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-status-normal)]/20 flex items-center justify-center">
                                            <User className="w-5 h-5 text-[var(--color-status-normal)]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">3. Manual Clearing</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            An operator physically clears the blockage based on the alert notification
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-[var(--color-background)] rounded-lg border border-[var(--color-border-color)]">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-[var(--color-status-normal)]/20 flex items-center justify-center">
                                            <Activity className="w-5 h-5 text-[var(--color-status-normal)]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">4. Flow Restored</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            The score drops back to normal, confirming the clear worked and flow is restored
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Before vs. After */}
                <Card className="bg-[var(--color-panel)] border-[var(--color-border-color)]">
                    <CardHeader>
                        <CardTitle className="text-[var(--color-text-primary)]">Before vs. After: Manual Clearing Intervention</CardTitle>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                            Visual comparison of buildup detection and successful manual intervention
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-[#101715] rounded-lg overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
                            <video
                                src="/chv3.mp4"
                                controls
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                                Before vs. After: Manual Clearing
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Badge variant="default" className="bg-[var(--color-status-normal)]/20 text-[var(--color-status-normal)] border-[var(--color-status-normal)]/30">
                                Buildup regions overlay
                            </Badge>
                            <Badge variant="default" className="bg-[var(--color-status-warning)]/20 text-[var(--color-status-warning)] border-[var(--color-status-warning)]/30">
                                Confidence scores included
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}