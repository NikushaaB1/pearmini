import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ListChecks,
  Plus,
  Trash2,
  Sparkles,
  Instagram,
  Star,
  CheckCircle2,
  Clock,
  Crown,
  Link2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ModelAvatar from '../components/ui/ModelAvatar'
import { useUserStore } from '../store/useUserStore'
import {
  canAssignDailyTaskPoints,
  canCreateDailyTasks,
  isProjectFace,
} from '../utils/roles'
import {
  createDailyTask,
  deleteDailyTask,
  submitTaskCompletion,
  awardTaskPoints,
} from '../services/dailyTasksService'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('ka-GE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return dateStr
  }
}

export default function DailyTasks() {
  const { user, role, modelId, models, dailyTasks, dailyTaskCompletions } = useUserStore()

  const [filterDate, setFilterDate] = useState(todayDate())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointsReward, setPointsReward] = useState('10')
  const [socialLink, setSocialLink] = useState('')
  const [taskDate, setTaskDate] = useState(todayDate())
  const [creating, setCreating] = useState(false)
  const [customPoints, setCustomPoints] = useState({})
  const [awardingId, setAwardingId] = useState(null)

  const isAdmin = canCreateDailyTasks(role)
  const canAward = canAssignDailyTaskPoints(role, user)
  const isModel = role === 'model' && modelId
  const projectFace = isProjectFace(user)

  const tasksForDate = useMemo(
    () => dailyTasks.filter((t) => t.taskDate === filterDate),
    [dailyTasks, filterDate]
  )

  const completionsByTask = useMemo(() => {
    const map = {}
    for (const c of dailyTaskCompletions) {
      if (!map[c.taskId]) map[c.taskId] = []
      map[c.taskId].push(c)
    }
    return map
  }, [dailyTaskCompletions])

  const myCompletions = useMemo(() => {
    if (!modelId) return new Set()
    return new Set(
      dailyTaskCompletions.filter((c) => c.modelId === modelId).map((c) => c.taskId)
    )
  }, [dailyTaskCompletions, modelId])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('სათაური აუცილებელია')

    setCreating(true)
    try {
      await createDailyTask({
        title,
        description,
        socialLink,
        pointsReward: Number(pointsReward) || 0,
        taskDate,
        createdBy: user?.displayName || 'ადმინი',
      })
      toast.success('დავალება შეიქმნა')
      setTitle('')
      setDescription('')
      setPointsReward('10')
      setSocialLink('')
    } catch (err) {
      toast.error(err.message || 'შექმნა ვერ მოხერხდა')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('წავშალოთ ეს დავალება?')) return
    try {
      await deleteDailyTask(taskId)
      toast.success('დავალება წაიშალა')
    } catch (err) {
      toast.error(err.message || 'წაშლა ვერ მოხერხდა')
    }
  }

  const handleComplete = async (task) => {
    if (!modelId) return toast.error('მოდელის პროფილი ვერ მოიძებნა')

    try {
      await submitTaskCompletion({ taskId: task.id, modelId })
      if (task.socialLink) {
        window.open(task.socialLink, '_blank', 'noopener,noreferrer')
        toast.success('დავალება მონიშნულია — გადაგიყვანთ სოცქსელში')
      } else {
        toast.success('დავალება მონიშნულია შესრულებულად')
      }
    } catch (err) {
      toast.error(err.message || 'შესრულება ვერ მოხერხდა')
    }
  }

  const handleAward = async (completion, defaultPoints) => {
    const pts = customPoints[completion.id] ?? defaultPoints
    setAwardingId(completion.id)
    try {
      await awardTaskPoints({
        completionId: completion.id,
        points: Number(pts),
        awardedBy: user?.displayName || 'ადმინი',
      })
      toast.success(`+${pts} ქულა მინიჭებულია`)
    } catch (err) {
      toast.error(err.message || 'ქულების მინიჭება ვერ მოხერხდა')
    } finally {
      setAwardingId(null)
    }
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[var(--accent)] text-xs uppercase tracking-[0.2em] mb-2">
                <Sparkles size={12} />
                ყოველდღიური
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
                <ListChecks size={30} strokeWidth={1.5} className="text-[var(--accent)]" />
                ყოველდღიური დავალებები
              </h1>
              <p className="text-[var(--text-muted)] mt-1.5">
                {isAdmin
                  ? 'შექმენი დღიური დავალებები მოდელებისთვის'
                  : canAward
                    ? 'შეამოწმე შესრულებული დავალებები და მიანიჭე ქულები'
                    : 'შეასრულე დღიური დავალებები და დააგროვე ქულები'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-[var(--text-muted)]">თარიღი:</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm border bg-[var(--bg-card)] text-[var(--text-primary)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>
          </div>
        </FadeInItem>

        {projectFace && !isAdmin && (
          <FadeInItem>
            <div
              className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{
                borderColor: 'var(--accent)',
                background: 'var(--accent-soft)',
              }}
            >
              <Crown size={18} className="text-[var(--accent)] shrink-0" />
              <p className="text-sm text-[var(--text-primary)]">
                <span className="font-semibold">პროექტის სახე</span> — შეგიძლია ქულების მინიჭება
                შესრულებულ დავალებებზე
              </p>
            </div>
          </FadeInItem>
        )}

        {isAdmin && (
          <FadeInItem>
            <Card hover={false} className="mb-8">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Plus size={18} />
                ახალი დავალება
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">სათაური *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="მაგ: Instagram Story გამოქვეყნება"
                      className="w-full px-3 py-2.5 rounded-xl text-sm border bg-[var(--bg-card)] text-[var(--text-primary)]"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">თარიღი</label>
                    <input
                      type="date"
                      value={taskDate}
                      onChange={(e) => {
                        setTaskDate(e.target.value)
                        setFilterDate(e.target.value)
                      }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm border bg-[var(--bg-card)] text-[var(--text-primary)]"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">აღწერა</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="დავალების დეტალები..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm border bg-[var(--bg-card)] text-[var(--text-primary)] resize-none"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  />
                </div>

                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">ქულები</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsReward}
                      onChange={(e) => setPointsReward(e.target.value)}
                      className="w-24 px-3 py-2.5 rounded-xl text-sm border bg-[var(--bg-card)] text-[var(--text-primary)]"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-[var(--text-muted)] mb-1 flex items-center gap-1">
                      <Instagram size={12} className="text-pink-500" />
                      სოციალური ლინკი (არასავალდებულო)
                    </label>
                    <input
                      type="url"
                      value={socialLink}
                      onChange={(e) => setSocialLink(e.target.value)}
                      placeholder="https://instagram.com/pear..."
                      className="w-full px-3 py-2.5 rounded-xl text-sm border bg-[var(--bg-card)] text-[var(--text-primary)]"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      დასრულებისას მოდელი ამ ლინკზე გადავა
                    </p>
                  </div>
                </div>

                <Button type="submit" disabled={creating}>
                  {creating ? 'იქმნება...' : 'დავალების შექმნა'}
                </Button>
              </form>
            </Card>
          </FadeInItem>
        )}

        <FadeInItem>
          {tasksForDate.length === 0 ? (
            <Card hover={false} className="text-center py-16">
              <ListChecks size={40} className="mx-auto text-[var(--text-muted)] mb-3 opacity-40" />
              <p className="text-[var(--text-muted)]">
                {filterDate === todayDate()
                  ? 'დღეს დავალებები ჯერ არ არის'
                  : `${formatDate(filterDate)}-ზე დავალებები არ მოიძებნა`}
              </p>
              {isAdmin && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  დაამატე ახალი დავალება ზემოთ ფორმით
                </p>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {tasksForDate.map((task) => {
                const completions = completionsByTask[task.id] || []
                const pending = completions.filter((c) => c.pointsAwarded == null)
                const done = completions.filter((c) => c.pointsAwarded != null)
                const iCompleted = myCompletions.has(task.id)

                return (
                  <motion.div
                    key={task.id}
                    layout
                    className="rounded-2xl border overflow-hidden"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card-solid)' }}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-[var(--text-primary)]">{task.title}</h3>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                              +{task.pointsReward} ქულა
                            </span>
                            {task.socialLink && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 flex items-center gap-1">
                                <Instagram size={10} />
                                სოც. ლინკი
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-[var(--text-muted)] mt-1">{task.description}</p>
                          )}
                          {task.socialLink && isAdmin && (
                            <a
                              href={task.socialLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-pink-500 hover:underline flex items-center gap-1 mt-1 truncate"
                            >
                              <Link2 size={10} />
                              {task.socialLink}
                            </a>
                          )}
                          <p className="text-[10px] text-[var(--text-muted)] mt-2">
                            {formatDate(task.taskDate)} · {completions.length} შესრულება
                          </p>
                        </div>

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-hover)] transition-colors shrink-0"
                            title="წაშლა"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {isModel && !iCompleted && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                          <Button size="sm" onClick={() => handleComplete(task)}>
                            {task.socialLink ? (
                              <>
                                <Link2 size={14} />
                                დასრულება და გადასვლა
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={14} />
                                შესრულებულად მონიშვნა
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {isModel && iCompleted && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-500">
                          <CheckCircle2 size={16} />
                          შენ უკვე შეასრულე ეს დავალება
                        </div>
                      )}
                    </div>

                    {canAward && (pending.length > 0 || done.length > 0) && (
                      <div
                        className="px-5 py-4 border-t space-y-3"
                        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          შესრულებები
                        </p>

                        <AnimatePresence>
                          {pending.map((c) => {
                            const model = models.find((m) => m.id === c.modelId)
                            return (
                              <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border"
                                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <ModelAvatar
                                    src={model?.avatar}
                                    name={model?.name}
                                    size="xs"
                                    className="!rounded-lg shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                      {model?.name || c.modelId}
                                    </p>
                                    <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                      <Clock size={9} />
                                      მოლოდინში
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <input
                                    type="number"
                                    min="0"
                                    value={customPoints[c.id] ?? task.pointsReward}
                                    onChange={(e) =>
                                      setCustomPoints((prev) => ({
                                        ...prev,
                                        [c.id]: e.target.value,
                                      }))
                                    }
                                    className="w-16 px-2 py-1.5 rounded-lg text-sm border text-center bg-[var(--bg-card)] text-[var(--text-primary)]"
                                    style={{ borderColor: 'var(--border-subtle)' }}
                                  />
                                  <Button
                                    size="sm"
                                    disabled={awardingId === c.id}
                                    onClick={() => handleAward(c, task.pointsReward)}
                                  >
                                    <Star size={14} />
                                    {awardingId === c.id ? '...' : 'ქულა'}
                                  </Button>
                                </div>
                              </motion.div>
                            )
                          })}

                          {done.map((c) => {
                            const model = models.find((m) => m.id === c.modelId)
                            return (
                              <div
                                key={c.id}
                                className="flex items-center gap-3 p-3 rounded-xl opacity-70"
                              >
                                <ModelAvatar
                                  src={model?.avatar}
                                  name={model?.name}
                                  size="xs"
                                  className="!rounded-lg shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[var(--text-primary)] truncate">
                                    {model?.name || c.modelId}
                                  </p>
                                </div>
                                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                  <CheckCircle2 size={12} />
                                  +{c.pointsAwarded} ქულა
                                </span>
                              </div>
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </FadeInItem>
      </FadeInContainer>
    </PageTransition>
  )
}
