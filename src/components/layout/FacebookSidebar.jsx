import { NavLink } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'
import ModelAvatar from '../ui/ModelAvatar'
import { getProfileAvatar } from '../../services/avatarService'
import { isAdminRole } from '../../utils/roles'
import { getMenuShortcuts } from '../../config/navigation'
import { logOut } from '../../services/authService'
import ThemeToggle from '../ui/ThemeToggle'

export default function FacebookSidebar() {
  const navigate = useNavigate()
  const { user, role, modelId, clearUser, models, userAvatar } = useUserStore()
  const profileAvatar = getProfileAvatar({ role, modelId, models, userAvatar })
  const profileLink = isAdminRole(role) ? '/profile' : modelId ? `/models/${modelId}` : '/dashboard'
  const [expanded, setExpanded] = useState(false)

  const shortcuts = getMenuShortcuts({
    profileLink,
    userName: user?.displayName || user?.email,
    isAdmin: isAdminRole(role),
  })

  const visible = expanded ? shortcuts : shortcuts.slice(0, 8)

  const handleLogout = async () => {
    await logOut()
    clearUser()
    navigate('/login')
  }

  return (
    <aside className="fb-sidebar hidden lg:block" aria-label="მენიუ">
      <nav className="fb-sidebar-nav">
        {visible.map((item) => (
          <NavLink
            key={item.to + item.label}
            to={item.to}
            className={({ isActive }) => `fb-menu-row ${isActive ? 'fb-menu-row--active' : ''}`}
          >
            {item.isProfile ? (
              <ModelAvatar
                src={profileAvatar}
                name={item.label}
                size="xs"
                roundedFull
                className="!w-9 !h-9 shrink-0"
              />
            ) : (
              <span className="fb-menu-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                <item.icon size={20} strokeWidth={1.75} />
              </span>
            )}
            <span className="fb-menu-label">{item.label}</span>
          </NavLink>
        ))}

        {shortcuts.length > 8 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="fb-menu-row fb-menu-row--btn"
          >
            <span className="fb-menu-icon fb-menu-icon--more">
              <ChevronDown size={20} className={expanded ? 'rotate-180' : ''} />
            </span>
            <span className="fb-menu-label">{expanded ? 'ნაკლები' : 'მეტის ნახვა'}</span>
          </button>
        )}

        <div className="fb-sidebar-divider" />

        <div className="fb-sidebar-footer">
          <ThemeToggle />
          <button type="button" onClick={handleLogout} className="fb-menu-row fb-menu-row--btn fb-menu-row--danger">
            <span className="fb-menu-icon fb-menu-icon--more">
              <LogOut size={18} />
            </span>
            <span className="fb-menu-label">გასვლა</span>
          </button>
        </div>
      </nav>
    </aside>
  )
}
