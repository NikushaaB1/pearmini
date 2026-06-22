import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { useUserStore } from '../store/useUserStore'
import ModelAvatar from '../components/ui/ModelAvatar'
import { getProfileAvatar } from '../services/avatarService'
import { isAdminRole } from '../utils/roles'
import { getMenuShortcuts } from '../config/navigation'
import { logOut } from '../services/authService'
import ThemeToggle from '../components/ui/ThemeToggle'

export default function Menu() {
  const navigate = useNavigate()
  const { user, role, modelId, clearUser, models, userAvatar, points } = useUserStore()
  const profileAvatar = getProfileAvatar({ role, modelId, models, userAvatar })
  const profileLink = isAdminRole(role) ? '/profile' : modelId ? `/models/${modelId}` : '/dashboard'
  const myPoints = modelId ? points[modelId] || 0 : null

  const shortcuts = getMenuShortcuts({
    profileLink,
    userName: user?.displayName || user?.email,
    isAdmin: isAdminRole(role),
  })

  const handleLogout = async () => {
    await logOut()
    clearUser()
    navigate('/login')
  }

  return (
    <PageTransition>
      <div className="fb-menu-page menu-page-shell">
        <div className="menu-page-scroll">
          <div className="menu-page-profile">
            <ModelAvatar
              src={profileAvatar}
              name={user?.displayName || user?.email}
              size="md"
              roundedFull
              className="ring-2 ring-[var(--accent-soft)]"
            />
            <div className="min-w-0">
              <p className="font-bold text-[var(--text-primary)] truncate">
                {user?.displayName || user?.email}
              </p>
              {myPoints !== null && (
                <p className="text-sm text-[var(--accent-bright)] font-semibold mt-0.5">
                  ★ {myPoints} ქულა
                </p>
              )}
            </div>
          </div>

          <div className="fb-menu-list">
            {shortcuts.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                className={({ isActive }) =>
                  `fb-menu-row fb-menu-row--page ${isActive ? 'fb-menu-row--active' : ''}`
                }
              >
                {item.isProfile ? (
                  <ModelAvatar
                    src={profileAvatar}
                    name={item.label}
                    size="sm"
                    roundedFull
                    className="!w-9 !h-9 shrink-0"
                  />
                ) : (
                  <span className="fb-menu-icon" style={{ background: item.iconBg, color: item.iconColor }}>
                    <item.icon size={22} strokeWidth={1.75} />
                  </span>
                )}
                <span className="fb-menu-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>

        <div className="menu-page-footer">
          <ThemeToggle />
          <button type="button" onClick={handleLogout} className="fb-logout-btn">
            <LogOut size={18} />
            გასვლა
          </button>
        </div>
      </div>
    </PageTransition>
  )
}
