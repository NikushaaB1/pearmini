import { NavLink, useLocation } from 'react-router-dom'
import { bottomNav, isNavActive } from '../../config/navigation'

export default function BottomNav() {
  const location = useLocation()

  return (
    <div className="bottom-nav-shell">
      <nav className="bottom-nav app-bottom-nav" aria-label="მთავარი ნავიგაცია">
        {bottomNav.map((item) => {
          const active = isNavActive(location.pathname, item.to, item.end)

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={`bottom-nav-item ${item.to === '/ai' ? 'bottom-nav-item--ai' : ''} ${active ? 'bottom-nav-item--active' : ''}`}
            >
              <span className="bottom-nav-item-icon">
                <item.icon size={20} strokeWidth={active ? 2.35 : 1.85} />
              </span>
              <span className="bottom-nav-item-label">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
