import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/store/userStore'
import { BottomNav } from '@/components/common/BottomNav'
import { PageTransition } from '@/components/common/PageTransition'
import { Skeleton } from '@/components/common/Skeleton'
import { Home } from '@/pages/Home'
import { Friends } from '@/pages/Friends'
import { Profile } from '@/pages/Profile'
import { Onboarding } from '@/pages/Onboarding'

function App() {
  const { isOnboarded, isLoading } = useUserStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <Skeleton.Avatar size="xl" className="mx-auto" />
          <Skeleton.Text lines={2} className="w-3/4 mx-auto" />
          <Skeleton.Button className="w-full" />
        </div>
      </div>
    )
  }

  // Show onboarding if not completed
  if (!isOnboarded) {
    return (
      <AnimatePresence mode="sync">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/onboarding"
            element={
              <PageTransition>
                <Onboarding />
              </PageTransition>
            }
          />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <AnimatePresence mode="sync">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/friends"
            element={
              <PageTransition>
                <Friends />
              </PageTransition>
            }
          />
          <Route
            path="/profile"
            element={
              <PageTransition>
                <Profile />
              </PageTransition>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </div>
  )
}

export default App
