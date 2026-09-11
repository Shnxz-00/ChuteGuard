import * as React from "react"
import { useStore } from "../../lib/store"
import { Gauge } from "../LiveDashboard/Gauge"

export function LiveAnalysisPage() {
    const { currentPhase, currentChoke, roiBox, rawOccupiedPixels, totalRoiPixels } = useStore()

    return (
        <div className="h-full w-full p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-heading font-bold text-white tracking-tight mb-2">Live Analysis</h1>
                <p className="text-sm text-[var(--color-text-muted)]">
                    Watch the CV pipeline in action — see exactly what the algorithm is counting in real time.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-8rem)]">
                {/* Left Column: Embedded CV Console */}
                <div className="bg-[var(--color-panel)] border border-[var(--color-border-color)] rounded-xl overflow-hidden relative" style={{ minHeight: '500px' }}>
                    <iframe
                        src="/chute.html"
                        className="w-full h-full border-0"
                        style={{ height: '100%', minHeight: '500px' }}
                        title="Chute CV Console"
                    />
                </div>

                {/* Right Column: Gauge and Data Readout */}
                <div className="flex flex-col gap-6">
                    {/* Gauge */}
                    <div className="bg-[var(--color-panel)] border border-[var(--color-border-color)] rounded-xl p-6 flex-1 flex flex-col items-center justify-center">
                        <Gauge value={currentChoke} phase={currentPhase} label="Choke %" />
                        <p className="mt-4 font-mono text-sm text-[var(--color-text-muted)] text-center">
                            Real-time choke percentage
                        </p>
                    </div>

                    {/* Raw Data Readout */}
                    <div className="bg-[var(--color-panel)] border border-[var(--color-border-color)] rounded-xl p-6">
                        <h3 className="text-lg font-heading font-semibold text-white mb-4">Raw Pixel Data</h3>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--color-text-muted)]">Raw occupied pixels:</span>
                                <span className="font-mono text-sm text-white">
                                    {rawOccupiedPixels ?? 0}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--color-text-muted)]">Total ROI pixels:</span>
                                <span className="font-mono text-sm text-white">
                                    {totalRoiPixels ?? 0}
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--color-text-muted)]">Persistent:</span>
                                <span className="font-mono text-sm text-[var(--color-status-normal)]">
                                    {totalRoiPixels && rawOccupiedPixels 
                                        ? ((rawOccupiedPixels / totalRoiPixels) * 100).toFixed(1) + '%'
                                        : '0%'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[var(--color-border-color)]">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-[var(--color-text-muted)]">Current Phase:</span>
                                <span className="font-mono text-sm text-[var(--color-status-normal)]">
                                    {currentPhase}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
