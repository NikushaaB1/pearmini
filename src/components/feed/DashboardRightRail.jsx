import { useNavigate } from 'react-router-dom'
import { Trophy, Megaphone, Crown, ArrowRight } from 'lucide-react'
import ModelAvatar from '../ui/ModelAvatar'

export default function DashboardRightRail({
  billboardModel,
  leaderboard,
  announcements,
  onNavigateAnnouncements,
}) {
  const navigate = useNavigate()

  return (
    <aside className="dashboard-rail hidden lg:block" aria-label="სიახლეები და რეიტინგი">
      {billboardModel && (
        <div className="dashboard-rail-card dashboard-rail-card--hero">
          <span className="dashboard-rail-badge">
            <Crown size={12} />
            Billboard
          </span>
          <ModelAvatar
            src={billboardModel.avatar}
            name={billboardModel.name}
            size="md"
            roundedFull
            className="mx-auto my-3 !w-16 !h-16 ring-4 ring-[var(--accent-soft)]"
          />
          <p className="font-bold text-center text-[var(--text-primary)]">{billboardModel.name}</p>
          <p className="text-xs text-center text-[var(--text-muted)] mt-1 line-clamp-2">{billboardModel.tagline}</p>
        </div>
      )}

      <div className="dashboard-rail-card">
        <h3 className="dashboard-rail-title">
          <Trophy size={16} />
          ტოპ რეიტინგი
        </h3>
        <div className="space-y-1">
          {leaderboard.slice(0, 5).map((model, i) => (
            <button
              key={model.id}
              type="button"
              onClick={() => navigate(`/models/${model.id}`)}
              className="dashboard-rail-row"
            >
              <span className="text-sm w-6">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
              <ModelAvatar src={model.avatar} name={model.name} size="xs" roundedFull className="!w-8 !h-8" />
              <span className="flex-1 truncate text-sm font-medium text-left">{model.name}</span>
              <span className="text-xs font-bold text-[var(--accent-bright)]">{model.points}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-rail-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="dashboard-rail-title !mb-0">
            <Megaphone size={16} />
            სიახლეები
          </h3>
          <button type="button" onClick={onNavigateAnnouncements} className="dashboard-rail-link">
            ყველა <ArrowRight size={12} />
          </button>
        </div>
        {announcements.slice(0, 3).map((ann) => (
          <button
            key={ann.id}
            type="button"
            onClick={onNavigateAnnouncements}
            className="dashboard-rail-news"
          >
            <p className="font-semibold text-sm truncate">{ann.title}</p>
            <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">{ann.content}</p>
          </button>
        ))}
      </div>
    </aside>
  )
}
