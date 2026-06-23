import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import Loader from '../components/ui/Loader'
import { useUserStore } from '../store/useUserStore'

const Login = lazy(() => import('../pages/Login'))
const About = lazy(() => import('../pages/About'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const ModelsOverview = lazy(() => import('../pages/ModelsOverview'))
const UploadsOverview = lazy(() => import('../pages/UploadsOverview'))
const ModelProfile = lazy(() => import('../pages/ModelProfile'))
const Admin = lazy(() => import('../pages/Admin'))
const Leaderboard = lazy(() => import('../pages/Leaderboard'))
const Announcements = lazy(() => import('../pages/Announcements'))
const Rules = lazy(() => import('../pages/Rules'))
const Chat = lazy(() => import('../pages/Chat'))
const Profile = lazy(() => import('../pages/Profile'))
const Challenges = lazy(() => import('../pages/Challenges'))
const Shop = lazy(() => import('../pages/Shop'))
const Polls = lazy(() => import('../pages/Polls'))
const DailyTasks = lazy(() => import('../pages/DailyTasks'))
const Menu = lazy(() => import('../pages/Menu'))
const Posts = lazy(() => import('../pages/Posts'))
const AiAssistant = lazy(() => import('../pages/AiAssistant'))

function ProtectedRoute({ children }) {
  const user = useUserStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const user = useUserStore((s) => s.user)
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function FallbackRedirect() {
  const user = useUserStore((s) => s.user)
  return <Navigate to={user ? '/dashboard' : '/about'} replace />
}

export default function AppRoutes() {
  const location = useLocation()

  return (
    <Suspense fallback={<Loader fullScreen text="იტვირთება..." />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/about" element={<About />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/models" element={<ModelsOverview />} />
            <Route path="/uploads" element={<UploadsOverview />} />
            <Route path="/models/:id" element={<ModelProfile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/polls" element={<Polls />} />
            <Route path="/daily-tasks" element={<DailyTasks />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/ai" element={<AiAssistant />} />
            <Route path="/menu" element={<Menu />} />
          </Route>

          <Route path="/signup" element={<Navigate to="/login" replace />} />
          <Route path="/" element={<FallbackRedirect />} />
          <Route path="*" element={<FallbackRedirect />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
