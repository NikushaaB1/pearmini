import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Smartphone, Wifi, Battery, X, Trash2, ArrowRight } from 'lucide-react'
import { useUserStore } from '../../store/useUserStore'

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = 'sine'
    // A nice iOS-like double chime (D5 -> A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08) // A5
    
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.45)
  } catch (e) {
    console.error('AudioContext error:', e)
  }
}

export default function NotificationHub() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const activityLog = useUserStore((s) => s.activityLog)
  const announcements = useUserStore((s) => s.announcements)

  const prevActivityLength = useRef(activityLog.length)
  const prevAnnouncementsLength = useRef(announcements.length)

  // Request browser notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Trigger web notification
  const triggerNativeNotification = (text) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('PEAR™ Elite', {
          body: text,
        })
      } catch (e) {
        console.error('Desktop notification failed:', e)
      }
    }
  }

  // Monitor activity log changes
  useEffect(() => {
    if (activityLog.length > prevActivityLength.current) {
      // New activity entry
      const latest = activityLog[0]
      if (latest && !latest.action.includes('სისტემა გაეშვა')) {
        const text = `${latest.user ? latest.user + ': ' : ''}${latest.action}`
        addNotification('აქტივობა', text)
      }
    }
    prevActivityLength.current = activityLog.length
  }, [activityLog])

  // Monitor announcements
  useEffect(() => {
    if (announcements.length > prevAnnouncementsLength.current) {
      const latest = announcements[0]
      if (latest) {
        addNotification('განცხადება', `ახალი განცხადება: ${latest.title}`)
      }
    }
    prevAnnouncementsLength.current = announcements.length
  }, [announcements])

  const addNotification = (type, text) => {
    const newNotif = {
      id: Date.now() + Math.random().toString(36).substring(2, 6),
      type,
      text,
      time: new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }),
    }
    setNotifications((prev) => [newNotif, ...prev])
    setUnreadCount((c) => c + 1)
    playNotificationSound()
    triggerNativeNotification(text)
  }

  const handleClear = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setUnreadCount(0)
  }

  // Get current Georgian date for iPhone lockscreen
  const getLockScreenDate = () => {
    return new Date().toLocaleDateString('ka-GE', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex items-end justify-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100, x: 20 }}
            className="w-80 h-[520px] rounded-[42px] border-[10px] border-neutral-900 shadow-2xl relative overflow-hidden flex flex-col"
            style={{
              background: '#0a0a0a',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Screen Wallpaper */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-950 via-slate-950 to-amber-950 opacity-90 z-0" />
            <div className="absolute inset-0 bg-black/20 z-0" />

            {/* Dynamic Island / Notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
              <span className="w-3.5 h-1 bg-neutral-950 rounded-full" />
            </div>

            {/* Status Bar */}
            <div className="relative z-20 px-6 pt-3 pb-1 flex items-center justify-between text-[11px] text-white/95 font-semibold">
              <span>{new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">5G</span>
                <Wifi size={11} />
                <Battery size={13} className="text-white" />
              </div>
            </div>

            {/* Lockscreen Header */}
            <div className="relative z-10 text-center mt-6 text-white">
              <p className="text-[11px] font-medium tracking-widest text-white/60 uppercase">
                {getLockScreenDate()}
              </p>
              <h2 className="text-4xl font-extralight tracking-tight mt-1">
                {new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}
              </h2>
            </div>

            {/* Notification Center Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10 space-y-2.5 flex flex-col mt-4">
              <div className="flex items-center justify-between text-[11px] text-white/50 px-2 font-medium">
                <span>შეტყობინებები</span>
                {notifications.length > 0 && (
                  <button onClick={handleClear} className="flex items-center gap-1 hover:text-white transition-colors">
                    <Trash2 size={11} />
                    გასუფთავება
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <Smartphone size={32} className="text-white/20 mb-2 animate-bounce" />
                  <p className="text-xs text-white/40">ახალი შეტყობინებები არ არის</p>
                </div>
              ) : (
                <div className="space-y-2 pb-6">
                  <AnimatePresence>
                    {notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="p-3 rounded-2xl backdrop-blur-xl border border-white/10 flex flex-col gap-1 shadow-lg"
                        style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                      >
                        <div className="flex justify-between items-center text-[10px] text-white/50 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                            {notif.type}
                          </span>
                          <span>{notif.time}</span>
                        </div>
                        <p className="text-xs text-white/90 leading-normal font-medium">{notif.text}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Phone Close Trigger / Swipe imitation */}
            <div className="relative z-20 pb-4 flex flex-col items-center">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all mb-1"
                title="ჩაკეცვა"
              >
                <X size={16} />
              </button>
              <div className="w-24 h-1 bg-white/40 rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleOpen}
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative border"
          style={{
            background: 'var(--bg-card-solid)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <Smartphone className="text-[var(--text-muted)]" size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {unreadCount}
            </span>
          )}
        </motion.button>
      )}
    </div>
  )
}
