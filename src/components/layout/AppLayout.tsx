import * as React from "react"
import { useStore } from "../../lib/store"
import { Activity, LayoutDashboard, LineChart, Box, WifiOff, Eye } from "lucide-react"
import { connectSocket, disconnectSocket } from "../../lib/socket"
import { Switch } from "../ui/Switch"

export function AppLayout({ children }: { children: React.ReactNode }) {
    const { activeTab, setActiveTab, isConnected, role, setRole, emailAlertsEnabled, soundAlertsEnabled, setEmailAlertsEnabled, setSoundAlertsEnabled } = useStore()

    const tabs = [
        { id: "dashboard", label: "Live Dashboard", icon: LayoutDashboard },
        { id: "live-analysis", label: "Live Analysis", icon: Eye },
        { id: "trends", label: "Trends & ROI", icon: LineChart },
        { id: "architecture", label: "Architecture", icon: Box },
    ] as const

    const handleLinkToggle = () => {
        if (isConnected) {
            disconnectSocket()
        } else {
            connectSocket()
        }
    }

    return (
        <div className="flex h-screen bg-[var(--color-background)] overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-[var(--color-border-color)] bg-[var(--color-panel)] flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-6 w-6 text-[var(--color-status-normal)]" />
                        <h1 className="text-xl font-heading font-bold text-white tracking-tight">ChuteGuard</h1>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] font-mono">Edge Control Interface</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                                ? "bg-[var(--color-text-primary)]/10 text-white"
                                : "text-[var(--color-text-muted)] hover:bg-[var(--color-border-color)] hover:text-white"
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-[var(--color-border-color)] space-y-4">
                    {/* Offline Banner — shown when disconnected */}
                    {!isConnected && (
                        <div className="flex items-center gap-2 bg-[var(--color-status-danger)]/15 border border-[var(--color-status-danger)]/50 rounded-md px-3 py-2">
                            <WifiOff className="h-3.5 w-3.5 text-[var(--color-status-danger)] shrink-0" />
                            <span className="text-[10px] font-mono text-[var(--color-status-danger)] leading-tight">
                                OFFLINE — edge operating independently
                            </span>
                        </div>
                    )}

                    {/* Link Status toggle (clickable for demo) */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">Link Status</span>
                        <button
                            onClick={handleLinkToggle}
                            title={isConnected ? "Click to simulate offline" : "Click to reconnect"}
                            className="flex items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-[var(--color-border-color)] transition-colors"
                        >
                            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-white">
                                {isConnected ? "ONLINE" : "OFFLINE"}
                            </span>
                            <div
                                className={`h-2 w-2 rounded-full transition-colors ${isConnected ? "bg-[var(--color-status-normal)]" : "bg-[var(--color-status-danger)]"
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Role selector */}
                    <div className="flex flex-col gap-2">
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">Role</span>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as "Operator" | "Supervisor")}
                            className="bg-[var(--color-background)] border border-[var(--color-border-color)] text-sm rounded-md px-2 py-1 text-white focus:outline-none"
                        >
                            <option value="Operator">Operator</option>
                            <option value="Supervisor">Supervisor</option>
                        </select>
                    </div>

                    {/* Alert Toggles */}
                    <div className="flex flex-col gap-3">
                        <span className="text-xs text-[var(--color-text-muted)] font-medium">Alerts</span>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--color-text-muted)]">Email</span>
                            <Switch
                                checked={emailAlertsEnabled}
                                onCheckedChange={setEmailAlertsEnabled}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--color-text-muted)]">Sound</span>
                            <Switch
                                checked={soundAlertsEnabled}
                                onCheckedChange={setSoundAlertsEnabled}
                            />
                        </div>
                    </div>

                    {/* Note about email alert limitation */}
                    <div className="text-[10px] text-[var(--color-text-muted)] opacity-70 leading-tight">
                        * Email toggle is UI-only for demo. Production would sync to backend.
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 relative">
                <div className="max-w-6xl mx-auto h-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
