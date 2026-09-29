import { useStore } from './lib/store'
import { AppLayout } from './components/layout/AppLayout'
import { LandingPage } from './pages/Landing'
import { DashboardPage } from './components/LiveDashboard/DashboardPage'
import { ErrorBoundary } from './components/ErrorBoundary'

import { TrendsPage } from './components/Trends/TrendsPage'

import { ArchitecturePage } from './components/Architecture/ArchitecturePage'

import { HowItWorksPage } from './components/HowItWorks/HowItWorksPage'
import { JourneyPage } from './components/Journey/JourneyPage'

function App() {
  const { activeTab } = useStore()

  return (
    <ErrorBoundary>
      <div className="bg-[var(--color-background)] min-h-screen text-white">
        {activeTab === 'landing' ? (
          <LandingPage />
        ) : (
          <AppLayout>
            {activeTab === 'dashboard' && <DashboardPage />}
            {activeTab === 'how-it-works' && <HowItWorksPage />}
            {activeTab === 'trends' && <TrendsPage />}
            {activeTab === 'architecture' && <ArchitecturePage />}
            {activeTab === 'journey' && <JourneyPage />}
          </AppLayout>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
