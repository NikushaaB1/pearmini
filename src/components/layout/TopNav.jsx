import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Upload,
  Trophy,
  Megaphone,
  MessageCircle,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Award,
  Gift,
  Vote,
  ListChecks,
  Grid3X3,
  Star,
  User,
  Settings,
} from 'lucide-react'
import pearLogo from '../../assets/pear-logo.jpg'
import ThemeToggle from '../ui/ThemeToggle'
import { logOut } from '../../services/authService'
import { useUserStore } from '../../store/useUserStore'
import ModelAvatar from '../ui/ModelAvatar'
import { getProfileAvatar } from '../../services/avatarService'
import { isAdminRole, roleLabel } from '../../utils/roles'

const primaryNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'დაფა' },
  { to: '/chat', icon: MessageCircle, label: 'ჩატი' },
  { to: '/announcements', icon: Megaphone, label: 'სიახლეები' },
  { to: '/leaderboard', icon: Trophy, label: 'რეიტინგი' },
]

const exploreNav = [
  { to: '/challenges', icon: Award, label: 'გამოწვევები', desc: 'კონკურსები' },
  { to: '/daily-tasks', icon: ListChecks, label: 'დავალებები', desc: 'ყოველდღიური' },
  { to: '/polls', icon: Vote, label: 'POLL', desc: 'გამოკითხვა' },
  { to: '/shop', icon: Gift, label: 'მაღაზია', desc: 'ქულები → საჩუქარი' },
]

const adminLinks = [
  { to: '/uploads', label: 'ატვირთვები', icon: Upload },
  { to: '/admin', label: 'ადმინი', icon: Shield },
]

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}>
      {({ isActive }) => (
        <>
          <span className="nav-item-icon">
            <Icon size={17} strokeWidth={isActive ? 2.25 : 1.75} />
          </span>
          <span className="nav-item-label">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function TopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, role, modelId, clearUser, models, userAvatar, points } = useUserStore()
  const profileAvatar = getProfileAvatar({ role, modelId, models, userAvatar })
  const myPoints = modelId ? points[modelId] || 0 : null
  const profileLink = isAdminRole(role) ? '/profile' : modelId ? `/models/${modelId}` : '/dashboard'

  const [mobileOpen, setMobileOpen] = useState(false)
  const [exploreOpen, setExploreOpen] = useState(false)
  const [modelsOpen, setModelsOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const exploreRef = useRef(null)
  const modelsRef = useRef(null)
  const userRef = useRef(null)

  useClickOutside(exploreRef, () => setExploreOpen(false))
  useClickOutside(modelsRef, () => setModelsOpen(false))
  useClickOutside(userRef, () => setUserOpen(false))

  useEffect(() => {
    setMobileOpen(false)
    setExploreOpen(false)
    setModelsOpen(false)
    setUserOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const handleLogout = async () => {
    await logOut()
    clearUser()
    navigate('/login')
  }

  const exploreActive = exploreNav.some((i) => location.pathname === i.to)

  const closeAll = () => {
    setExploreOpen(false)
    setModelsOpen(false)
    setUserOpen(false)
  }

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="nav-wrapper"
      >
        <div className="nav-float">
          {/* Brand */}
          <NavLink to="/dashboard" className="nav-brand">
            <img src={pearLogo} alt="PEAR" className="nav-brand-logo" />
            <div className="hidden sm:block">
              <p className="nav-brand-title">PEAR™</p>
              <p className="nav-brand-sub">Elite Network</p>
            </div>
          </NavLink>

          <div className="nav-divider hidden lg:block" />

          {/* Desktop navigation */}
          <nav className="nav-links hidden lg:flex">
            {primaryNav.map((item) => (
              <NavItem key={item.to} {...item} end={item.to === '/dashboard'} />
            ))}

            {/* Explore grid popover */}
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => {
                  setExploreOpen((v) => !v)
                  setModelsOpen(false)
                }}
                className={`nav-menu-btn ${exploreActive || exploreOpen ? 'nav-menu-btn--open' : ''}`}
              >
                <Grid3X3 size={16} strokeWidth={1.75} />
                <span className="hidden xl:inline">აღმოჩენა</span>
                <ChevronDown size={13} className={`transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {exploreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="nav-popover"
                  >
                    <div className="nav-popover-grid">
                      {exploreNav.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={closeAll}
                          className={({ isActive }) =>
                            `nav-popover-card ${isActive ? 'nav-popover-card--active' : ''}`
                          }
                        >
                          <span className="nav-popover-card-icon">
                            <item.icon size={16} strokeWidth={1.75} />
                          </span>
                          <span className="text-xs font-semibold">{item.label}</span>
                          <span className="text-[10px] opacity-70">{item.desc}</span>
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Models */}
            <div className="relative" ref={modelsRef}>
              <button
                onClick={() => {
                  setModelsOpen((v) => !v)
                  setExploreOpen(false)
                }}
                className={`nav-menu-btn ${modelsOpen ? 'nav-menu-btn--open' : ''}`}
              >
                <Users size={16} strokeWidth={1.75} />
                <span className="hidden xl:inline">მოდელები</span>
                <ChevronDown size={13} className={`transition-transform ${modelsOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {modelsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="nav-popover w-64 max-h-80 overflow-y-auto"
                  >
                    <NavLink
                      to="/models"
                      onClick={closeAll}
                      className={({ isActive }) =>
                        `nav-popover-list-item font-semibold ${isActive ? 'nav-popover-list-item--active' : ''}`
                      }
                    >
                      <Users size={16} />
                      ყველა მოდელი
                    </NavLink>
                    {models.map((m) => (
                      <NavLink
                        key={m.id}
                        to={`/models/${m.id}`}
                        onClick={closeAll}
                        className={({ isActive }) =>
                          `nav-popover-list-item ${isActive ? 'nav-popover-list-item--active' : ''}`
                        }
                      >
                        <ModelAvatar src={m.avatar} name={m.name} size="xs" className="!rounded-lg !w-8 !h-8" />
                        <span className="truncate flex-1">
                          {m.name}
                          {!isAdminRole(role) && m.id === modelId && (
                            <span className="text-[10px] text-[var(--accent)] ml-1">• შენი</span>
                          )}
                        </span>
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAdminRole(role) &&
              adminLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      <span className="nav-item-icon">
                        <item.icon size={17} strokeWidth={isActive ? 2.25 : 1.75} />
                      </span>
                      <span className="nav-item-label">{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
          </nav>

          {/* Actions */}
          <div className="nav-actions">
            {myPoints !== null && (
              <motion.span
                key={myPoints}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="nav-points hidden sm:inline-flex"
              >
                <Star size={11} fill="currentColor" strokeWidth={0} />
                {myPoints}
              </motion.span>
            )}

            <ThemeToggle />

            <div className="relative hidden sm:block" ref={userRef}>
              <button
                onClick={() => setUserOpen((v) => !v)}
                className={`nav-user-btn ${userOpen ? 'nav-user-btn--open' : ''}`}
              >
                <ModelAvatar
                  src={profileAvatar}
                  name={user?.displayName || user?.email}
                  size="xs"
                  roundedFull
                  className="ring-2 ring-[var(--accent-soft)]"
                />
                <div className="hidden md:block text-left pr-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)] max-w-[5.5rem] truncate leading-tight">
                    {user?.displayName || user?.email}
                  </p>
                  <p className="text-[9px] text-[var(--text-subtle)] uppercase tracking-wider">
                    {roleLabel(role)}
                  </p>
                </div>
                <ChevronDown
                  size={13}
                  className={`text-[var(--text-muted)] hidden md:block transition-transform ${userOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="nav-popover nav-popover--right w-52"
                  >
                    <NavLink
                      to={profileLink}
                      onClick={closeAll}
                      className="nav-popover-list-item"
                    >
                      <User size={16} />
                      ჩემი პროფილი
                    </NavLink>
                    {isAdminRole(role) && (
                      <NavLink to="/admin" onClick={closeAll} className="nav-popover-list-item">
                        <Settings size={16} />
                        ადმინ პანელი
                      </NavLink>
                    )}
                    <button
                      onClick={handleLogout}
                      className="nav-popover-list-item w-full text-red-500 hover:bg-red-500/10"
                    >
                      <LogOut size={16} />
                      გასვლა
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl border transition-all"
              style={{
                borderColor: 'var(--border-medium)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
              aria-label="მენიუ"
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer portal */}
      {createPortal(
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="nav-mobile-backdrop lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: '105%', opacity: 0.8 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '105%', opacity: 0.8 }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                className="nav-mobile-drawer lg:hidden"
              >
                <div className="nav-mobile-hero flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ModelAvatar
                      src={profileAvatar}
                      name={user?.displayName || user?.email}
                      size="md"
                      roundedFull
                      className="ring-2 ring-[var(--accent-soft)] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-base font-bold text-[var(--text-primary)] truncate">
                        {user?.displayName || user?.email}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{roleLabel(role)}</p>
                      {myPoints !== null && (
                        <span className="nav-points inline-flex mt-2 text-xs">
                          <Star size={11} fill="currentColor" strokeWidth={0} />
                          {myPoints} ქულა
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                  <p className="nav-mobile-section-label">მთავარი</p>
                  {primaryNav.map((item, i) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <NavLink
                        to={item.to}
                        end={item.to === '/dashboard'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `nav-mobile-link ${isActive ? 'nav-mobile-link--active' : ''}`
                        }
                      >
                        <span className="nav-mobile-link-icon">
                          <item.icon size={18} strokeWidth={1.75} />
                        </span>
                        {item.label}
                      </NavLink>
                    </motion.div>
                  ))}

                  <p className="nav-mobile-section-label">აღმოჩენა</p>
                  {exploreNav.map((item, i) => (
                    <motion.div
                      key={item.to}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.16 + i * 0.04 }}
                    >
                      <NavLink
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `nav-mobile-link ${isActive ? 'nav-mobile-link--active' : ''}`
                        }
                      >
                        <span className="nav-mobile-link-icon">
                          <item.icon size={18} strokeWidth={1.75} />
                        </span>
                        <span>
                          {item.label}
                          <span className="block text-[10px] opacity-60 font-normal">{item.desc}</span>
                        </span>
                      </NavLink>
                    </motion.div>
                  ))}

                  <p className="nav-mobile-section-label">მოდელები</p>
                  <NavLink
                    to="/models"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `nav-mobile-link ${isActive ? 'nav-mobile-link--active' : ''}`
                    }
                  >
                    <span className="nav-mobile-link-icon">
                      <Users size={18} />
                    </span>
                    ყველა მოდელი
                  </NavLink>
                  {models.slice(0, 8).map((m) => (
                    <NavLink
                      key={m.id}
                      to={`/models/${m.id}`}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `nav-mobile-link ${isActive ? 'nav-mobile-link--active' : ''}`
                      }
                    >
                      <ModelAvatar src={m.avatar} name={m.name} size="xs" className="!rounded-lg !w-9 !h-9" />
                      <span className="truncate">{m.name}</span>
                    </NavLink>
                  ))}

                  {isAdminRole(role) && (
                    <>
                      <p className="nav-mobile-section-label">მართვა</p>
                      {adminLinks.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `nav-mobile-link ${isActive ? 'nav-mobile-link--active' : ''}`
                          }
                        >
                          <span className="nav-mobile-link-icon">
                            <item.icon size={18} />
                          </span>
                          {item.label}
                        </NavLink>
                      ))}
                      <NavLink
                        to="/models"
                        onClick={() => setMobileOpen(false)}
                        className="nav-mobile-link"
                      >
                        <span className="nav-mobile-link-icon">
                          <Users size={18} />
                        </span>
                        მოდელების სია
                      </NavLink>
                    </>
                  )}
                </div>

                <div className="p-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/15 transition-colors"
                  >
                    <LogOut size={18} />
                    გასვლა
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
