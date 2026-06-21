import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import BrandBackground from './BrandBackground'
import FloatingMusicPlayer from '../ui/FloatingMusicPlayer'
import NotificationHub from '../ui/NotificationHub'

export default function AppLayout() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <BrandBackground />
      <TopNav />
      <main className="relative z-10 px-3 sm:px-6 lg:px-8 pb-8 sm:pb-10 pt-2 sm:pt-4 max-w-7xl mx-auto w-full min-w-0">
        <Outlet />
      </main>
      <FloatingMusicPlayer />
      <NotificationHub />
    </div>
  )
}
