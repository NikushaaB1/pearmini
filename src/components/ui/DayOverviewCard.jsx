import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, ListChecks, Trophy, ArrowRight } from 'lucide-react'
import TaskTimer, { isTaskExpired } from './TaskTimer'
import Button from './Button'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

export default function DayOverviewCard({
  modelId,
  points = {},
  dailyTasks = [],
  dailyTaskCompletions = [],
  dailyTaskPenalties = [],
  rank = null,
  centered = false,
}) {
  const navigate = useNavigate()
  const myPoints = points[modelId] || 0

  const incomplete = useMemo(() => {
    const completed = new Set(
      dailyTaskCompletions.filter((c) => c.modelId === modelId).map((c) => c.taskId)
    )
    const penalized = new Set(
      dailyTaskPenalties.filter((p) => p.modelId === modelId).map((p) => p.taskId)
    )
    return dailyTasks.filter(
      (t) =>
        t.taskDate === todayDate() &&
        !completed.has(t.id) &&
        !penalized.has(t.id) &&
        !isTaskExpired(t.expiresAt)
    )
  }, [dailyTasks, dailyTaskCompletions, dailyTaskPenalties, modelId])

  const nearestTask = useMemo(() => {
    if (!incomplete.length) return null
    return [...incomplete].sort(
      (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    )[0]
  }, [incomplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`day-overview elite-panel elite-panel-glow mb-6 sm:mb-8${centered ? ' day-overview--centered' : ''}`}
    >
      <div className="day-overview-header">
        <div>
          <p className="page-eyebrow mb-1">
            <ListChecks size={10} />
            დღის მიმოხილვა
          </p>
          <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            შენი დღე
          </h2>
        </div>
        <Button variant="secondary" onClick={() => navigate('/daily-tasks')} className="!px-4 !py-2 !text-xs shrink-0">
          ყველა დავალება
          <ArrowRight size={14} />
        </Button>
      </div>

      <div className="day-overview-stats">
        <div className="elite-stat">
          <p className="elite-stat-label">
            <Star size={10} />
            ქულები
          </p>
          <p className="elite-stat-value">{myPoints}</p>
        </div>
        <div className="elite-stat">
          <p className="elite-stat-label">
            <ListChecks size={10} />
            დარჩენილი
          </p>
          <p className="elite-stat-value">{incomplete.length}</p>
        </div>
        {rank != null && (
          <div className="elite-stat">
            <p className="elite-stat-label">
              <Trophy size={10} />
              რეიტინგი
            </p>
            <p className="elite-stat-value">#{rank}</p>
          </div>
        )}
      </div>

      {nearestTask ? (
        <button
          type="button"
          onClick={() => navigate('/daily-tasks')}
          className="day-overview-task"
        >
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-subtle)] mb-0.5">
              შემდეგი დავალება
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {nearestTask.title}
            </p>
            <p className="text-xs text-[var(--accent)] mt-0.5">+{nearestTask.pointsReward} ქულა</p>
          </div>
          <TaskTimer expiresAt={nearestTask.expiresAt} size="sm" />
        </button>
      ) : (
        <div className="day-overview-empty">
          <p className="text-sm text-[var(--text-muted)]">
            {incomplete.length === 0 && dailyTasks.some((t) => t.taskDate === todayDate())
              ? 'დღევანდელი დავალებები შესრულებულია'
              : 'დღეს ახალი დავალება ჯერ არ არის'}
          </p>
        </div>
      )}
    </motion.div>
  )
}
