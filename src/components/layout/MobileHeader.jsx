import { NavLink } from 'react-router-dom'
import { Star } from 'lucide-react'
import pearLogo from '../../assets/pear-logo.jpg'
import ThemeToggle from '../ui/ThemeToggle'
import { useUserStore } from '../../store/useUserStore'

export default function MobileHeader() {
  const { modelId, points } = useUserStore()
  const myPoints = modelId ? points[modelId] || 0 : null

  return (
    <header className="mobile-header">
      <NavLink to="/dashboard" className="mobile-header-brand">
        <img src={pearLogo} alt="PEAR" className="mobile-header-logo" />
        <div className="mobile-header-brand-text">
          <span className="mobile-header-title">PEAR</span>
          <span className="mobile-header-sub">Elite</span>
        </div>
      </NavLink>

      <div className="mobile-header-actions">
        {myPoints !== null && (
          <span className="mobile-header-points">
            <Star size={11} fill="currentColor" strokeWidth={0} />
            {myPoints}
          </span>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}
