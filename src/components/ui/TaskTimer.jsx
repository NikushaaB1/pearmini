import { useEffect, useState, useCallback } from 'react'
import { Timer, AlertTriangle } from 'lucide-react'

function getRemainingMs(expiresAt) {
  if (!expiresAt) return null
  return new Date(expiresAt).getTime() - Date.now()
}

function formatRemaining(ms) {
  if (ms <= 0) return '00:00:00'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function TaskTimer({ expiresAt, onExpire, size = 'md', className = '' }) {
  const [remaining, setRemaining] = useState(() => getRemainingMs(expiresAt))

  const stableOnExpire = useCallback(() => {
    onExpire?.()
  }, [onExpire])

  useEffect(() => {
    if (!expiresAt) return undefined

    const tick = () => {
      const ms = getRemainingMs(expiresAt)
      setRemaining(ms)
      if (ms !== null && ms <= 0) {
        stableOnExpire()
        return true
      }
      return false
    }

    if (tick()) return undefined

    const interval = setInterval(() => {
      if (tick()) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [expiresAt, stableOnExpire])

  if (!expiresAt) return null

  const expired = remaining !== null && remaining <= 0
  const urgent = !expired && remaining !== null && remaining < 5 * 60 * 1000

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-1 gap-1'
    : 'text-sm px-3 py-1.5 gap-1.5'

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold rounded-full border ${sizeClasses} ${className} ${
        expired
          ? 'bg-red-500/10 text-red-500 border-red-500/25'
          : urgent
            ? 'bg-amber-500/10 text-amber-600 border-amber-500/25 animate-pulse'
            : 'bg-[var(--accent-soft)] text-[var(--accent-bright)] border-[var(--border-medium)]'
      }`}
    >
      {expired ? <AlertTriangle size={size === 'sm' ? 11 : 13} /> : <Timer size={size === 'sm' ? 11 : 13} />}
      {expired ? 'ვადა გავიდა' : formatRemaining(remaining ?? 0)}
    </span>
  )
}

export function isTaskExpired(expiresAt) {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() <= Date.now()
}
