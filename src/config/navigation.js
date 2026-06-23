import {
  Home,
  Users,
  Megaphone,
  Store,
  Trophy,
  MessageCircle,
  ListChecks,
  Award,
  Gift,
  Vote,
  Upload,
  Shield,
  Settings,
  LayoutGrid,
  Newspaper,
  Sparkles,
  ScrollText,
} from 'lucide-react'

/** Desktop center tabs */
export const centerNav = [
  { to: '/dashboard', icon: Home, label: 'მთავარი', end: true },
  { to: '/posts', icon: Newspaper, label: 'პოსტები' },
  { to: '/ai', icon: Sparkles, label: 'AI' },
  { to: '/models', icon: Users, label: 'მოდელები' },
  { to: '/announcements', icon: Megaphone, label: 'განცხადებები' },
  { to: '/shop', icon: Store, label: 'მაღაზია' },
  { to: '/leaderboard', icon: Trophy, label: 'რეიტინგი' },
]

/** Mobile bottom tabs — Facebook 5-tab bar */
export const bottomNav = [
  { to: '/dashboard', icon: Home, label: 'მთავარი', end: true },
  { to: '/posts', icon: Newspaper, label: 'პოსტები' },
  { to: '/ai', icon: Sparkles, label: 'AI' },
  { to: '/models', icon: Users, label: 'მოდელები' },
  { to: '/menu', icon: LayoutGrid, label: 'მენიუ' },
]

/** Facebook Menu shortcuts (sidebar + /menu page) */
export function getMenuShortcuts({ profileLink, userName, isAdmin }) {
  const items = [
    {
      to: profileLink,
      icon: Users,
      label: userName || 'ჩემი პროფილი',
      iconBg: 'rgba(181, 106, 130, 0.15)',
      iconColor: '#b56a82',
      isProfile: true,
    },
    { to: '/chat', icon: MessageCircle, label: 'მესენჯერი', iconBg: 'rgba(181, 106, 130, 0.12)', iconColor: '#8b4563' },
    { to: '/ai', icon: Sparkles, label: 'PEAR AI', iconBg: 'rgba(212, 168, 83, 0.2)', iconColor: '#b8860b' },
    { to: '/posts', icon: Newspaper, label: 'პოსტები', iconBg: 'rgba(201, 149, 106, 0.16)', iconColor: '#c9956a' },
    { to: '/daily-tasks', icon: ListChecks, label: 'დავალებები', iconBg: 'rgba(212, 137, 159, 0.14)', iconColor: '#b56a82' },
    { to: '/leaderboard', icon: Trophy, label: 'რეიტინგი', iconBg: 'rgba(212, 168, 83, 0.18)', iconColor: '#b8860b' },
    { to: '/challenges', icon: Award, label: 'გამოწვევები', iconBg: 'rgba(183, 110, 121, 0.12)', iconColor: '#b76e79' },
    { to: '/polls', icon: Vote, label: 'POLL', iconBg: 'rgba(212, 168, 83, 0.14)', iconColor: '#b8860b' },
    { to: '/announcements', icon: Megaphone, label: 'განცხადებები', iconBg: 'rgba(201, 169, 98, 0.15)', iconColor: '#c9956a' },
    { to: '/rules', icon: ScrollText, label: 'წესები', iconBg: 'rgba(183, 110, 121, 0.12)', iconColor: '#b76e79' },
    { to: '/shop', icon: Gift, label: 'მაღაზია', iconBg: 'rgba(240, 215, 140, 0.2)', iconColor: '#b8860b' },
  ]

  if (isAdmin) {
    items.push(
      { to: '/uploads', icon: Upload, label: 'ატვირთვები', iconBg: 'rgba(201, 149, 106, 0.12)', iconColor: '#c9956a' },
      { to: '/admin', icon: Shield, label: 'ადმინ პანელი', iconBg: 'rgba(228, 30, 63, 0.1)', iconColor: '#e41e3f' },
      { to: '/profile', icon: Settings, label: 'პარამეტრები', iconBg: 'rgba(201, 169, 98, 0.15)', iconColor: '#b8860b' }
    )
  }

  return items
}

export function isNavActive(pathname, to, end = false) {
  if (end) return pathname === to
  if (to === '/menu') return pathname === '/menu'
  return pathname === to || pathname.startsWith(`${to}/`)
}
