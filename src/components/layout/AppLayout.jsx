import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import BrandBackground from './BrandBackground'
import FloatingMusicPlayer from '../ui/FloatingMusicPlayer'
import NotificationHub from '../ui/NotificationHub'

export default function AppLayout() {
  return (
    <div className="min-h-screen relative">
      <BrandBackground />
      <TopNav />
      <main className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Outlet />
      </main>
      <FloatingMusicPlayer />
      <NotificationHub />
    </div>
  )
}
