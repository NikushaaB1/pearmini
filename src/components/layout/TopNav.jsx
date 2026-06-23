import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Upload,
  Trophy,
  Megaphone,
  MessageCircle,
  Shield,
  ChevronDown,
  Award,
  Gift,
  Vote,
  ListChecks,
  Grid3X3,
  Star,
  User,
  Settings,
  Newspaper,
  Sparkles,
  ScrollText,
  LogOut,
} from 'lucide-react'
import pearLogo from '../../assets/pear-logo.jpg'
import ThemeToggle from '../ui/ThemeToggle'
import { useUserStore } from '../../store/useUserStore'
import ModelAvatar from '../ui/ModelAvatar'
import { getProfileAvatar } from '../../services/avatarService'
import { isAdminRole, roleLabel } from '../../utils/roles'
import { logOut } from '../../services/authService'

const primaryNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'მთავარი' },
  { to: '/posts', icon: Newspaper, label: 'პოსტები' },
  { to: '/ai', icon: Sparkles, label: 'AI', ai: true },
  { to: '/chat', icon: MessageCircle, label: 'ჩატი' },
]

const exploreNav = [
  { to: '/announcements', icon: Megaphone, label: 'განცხადებები', desc: 'ოფიციალური' },
  { to: '/rules', icon: ScrollText, label: 'წესები', desc: 'პლატფორმის წესები' },
  { to: '/leaderboard', icon: Trophy, label: 'რეიტინგი', desc: 'TOP ქულები' },
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

function NavItem({ to, icon: Icon, label, end, ai = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-item ${ai ? 'nav-item--ai' : ''} ${isActive ? 'nav-item--active' : ''}`
      }
    >
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
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role, modelId, models, userAvatar, points, clearUser } = useUserStore()
  const profileAvatar = getProfileAvatar({ role, modelId, models, userAvatar })
  const myPoints = modelId ? points[modelId] || 0 : null
  const profileLink = isAdminRole(role) ? '/profile' : modelId ? `/models/${modelId}` : '/dashboard'

  const [exploreOpen, setExploreOpen] = useState(false)
  const [modelsOpen, setModelsOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const exploreRef = useRef(null)
  const modelsRef = useRef(null)
  const userRef = useRef(null)

  useClickOutside(exploreRef, useCallback(() => setExploreOpen(false), []))
  useClickOutside(modelsRef, useCallback(() => setModelsOpen(false), []))
  useClickOutside(userRef, useCallback(() => setUserOpen(false), []))

  useEffect(() => {
    setExploreOpen(false)
    setModelsOpen(false)
    setUserOpen(false)
  }, [location.pathname])

  const exploreActive =
    exploreNav.some((i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`))

  const closeAll = () => {
    setExploreOpen(false)
    setModelsOpen(false)
    setUserOpen(false)
  }

  const handleLogout = async () => {
    closeAll()
    await logOut()
    clearUser()
    navigate('/login')
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="nav-wrapper app-top-nav app-top-nav--desktop"
    >
      <div className="nav-float">
        <NavLink to="/dashboard" className="nav-brand">
          <img src={pearLogo} alt="PEAR" className="nav-brand-logo" />
          <div>
            <p className="nav-brand-title">PEAR™</p>
            <p className="nav-brand-sub">Elite Network</p>
          </div>
        </NavLink>

        <div className="nav-divider" />

        <nav className="nav-links flex">
          <div className="nav-links-scroll">
            {primaryNav.map((item) => (
              <NavItem key={item.to} {...item} end={item.to === '/dashboard'} />
            ))}
          </div>

          <div className="relative shrink-0" ref={exploreRef}>
            <button
              type="button"
              onClick={() => {
                setExploreOpen((v) => !v)
                setModelsOpen(false)
              }}
              className={`nav-menu-btn ${exploreActive || exploreOpen ? 'nav-menu-btn--open' : ''}`}
            >
              <Grid3X3 size={16} strokeWidth={1.75} />
              <span>აღმოჩენა</span>
              <ChevronDown size={13} className={`transition-transform ${exploreOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {exploreOpen && (
                <motion.div
                  key="explore-popover"
                  className="nav-popover-anchor"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="nav-popover">
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative shrink-0" ref={modelsRef}>
            <button
              type="button"
              onClick={() => {
                setModelsOpen((v) => !v)
                setExploreOpen(false)
              }}
              className={`nav-menu-btn ${modelsOpen ? 'nav-menu-btn--open' : ''}`}
            >
              <Users size={16} strokeWidth={1.75} />
              <span>მოდელები</span>
              <ChevronDown size={13} className={`transition-transform ${modelsOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {modelsOpen && (
                <motion.div
                  key="models-popover"
                  className="nav-popover-anchor"
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="nav-popover w-64 max-h-80 overflow-y-auto">
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
                  </div>
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

        <div className="nav-actions">
          {myPoints !== null && (
            <motion.span
              key={myPoints}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="nav-points inline-flex"
            >
              <Star size={11} fill="currentColor" strokeWidth={0} />
              {myPoints}
            </motion.span>
          )}

          <ThemeToggle />

          <div className="relative" ref={userRef}>
            <button
              type="button"
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
              <div className="text-left pr-1">
                <p className="text-xs font-semibold text-[var(--text-primary)] max-w-[5.5rem] truncate leading-tight">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-[9px] text-[var(--text-subtle)] uppercase tracking-wider">
                  {roleLabel(role)}
                </p>
              </div>
              <ChevronDown
                size={13}
                className={`text-[var(--text-muted)] transition-transform ${userOpen ? 'rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  key="user-popover"
                  className="nav-popover-anchor nav-popover-anchor--right"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                >
                  <div className="nav-popover w-52">
                    <NavLink to={profileLink} onClick={closeAll} className="nav-popover-list-item">
                      <User size={16} />
                      ჩემი პროფილი
                    </NavLink>
                    {isAdminRole(role) && (
                      <NavLink to="/admin" onClick={closeAll} className="nav-popover-list-item">
                        <Settings size={16} />
                        ადმინ პანელი
                      </NavLink>
                    )}
                    <button type="button" onClick={handleLogout} className="nav-popover-list-item nav-popover-list-item--danger w-full">
                      <LogOut size={16} />
                      გასვლა
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
