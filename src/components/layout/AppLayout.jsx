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
      <main className="relative z-10 px-4 sm:px-6 lg:px-8 pb-8 pt-2 sm:pt-4 max-w-7xl mx-auto">
        <Outlet />
      </main>
      <FloatingMusicPlayer />
      <NotificationHub />
    </div>
  )
}
