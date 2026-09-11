import { useEffect } from 'react'
import { connectSocket, disconnectSocket } from './lib/socket'
import { useStore } from './lib/store'
import { AppLayout } from './components/layout/AppLayout'
import { LandingPage } from './pages/Landing'
import { DashboardPage } from './components/LiveDashboard/DashboardPage'
import { ErrorBoundary } from './components/ErrorBoundary'

import { TrendsPage } from './components/Trends/TrendsPage'

import { ArchitecturePage } from './components/Architecture/ArchitecturePage'

import { LiveAnalysisPage } from './components/LiveAnalysis/LiveAnalysisPage'

function App() {
  const { activeTab } = useStore()

  useEffect(() => {
    connectSocket()
    return () => {
      disconnectSocket()
    }
  }, [])

  return (
    <ErrorBoundary>
      <div className="bg-[var(--color-background)] min-h-screen text-white">
        {activeTab === 'landing' ? (
          <LandingPage />
        ) : (
          <AppLayout>
            {activeTab === 'dashboard' && <DashboardPage />}
            {activeTab === 'live-analysis' && <LiveAnalysisPage />}
            {activeTab === 'trends' && <TrendsPage />}
            {activeTab === 'architecture' && <ArchitecturePage />}
          </AppLayout>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
