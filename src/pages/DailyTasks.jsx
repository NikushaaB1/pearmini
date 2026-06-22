import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ListChecks,
  Plus,
  Trash2,
  Instagram,
  Star,
  CheckCircle2,
  Clock,
  Crown,
  Link2,
  AlertTriangle,
  Upload,
  MessageSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ModelAvatar from '../components/ui/ModelAvatar'
import PageHeader from '../components/ui/PageHeader'
import PageBreadcrumb from '../components/ui/PageBreadcrumb'
import TaskTimer, { isTaskExpired } from '../components/ui/TaskTimer'
import TaskSubmissionZone from '../components/ui/TaskSubmissionZone'
import { uploadImage } from '../services/storage'
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
  applyTaskPenalty,
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

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}სთ ${m}წთ`
  if (h > 0) return `${h} საათი`
  return `${m} წუთი`
}

function TaskPenaltyWatcher({ taskId, modelId, expiresAt, completed, penalized }) {
  const appliedRef = useRef(false)

  const tryPenalty = useCallback(async () => {
    if (!modelId || completed || penalized || appliedRef.current) return
    if (!isTaskExpired(expiresAt)) return

    appliedRef.current = true
    try {
      const result = await applyTaskPenalty({ taskId, modelId })
      if (result) {
        toast.error(`ვადა გავიდა — ${result.pointsDeducted} ქულა დაკლებულია`, { icon: '⏱️' })
      }
    } catch {
      appliedRef.current = false
    }
  }, [taskId, modelId, expiresAt, completed, penalized])

  useEffect(() => {
    tryPenalty()
  }, [tryPenalty])

  return null
}

export default function DailyTasks() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const smsAutoCompleteRef = useRef(false)

  const { user, role, modelId, models, dailyTasks, dailyTaskCompletions, dailyTaskPenalties } =
    useUserStore()

  const [filterDate, setFilterDate] = useState(todayDate())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [pointsReward, setPointsReward] = useState('10')
  const [durationMinutes, setDurationMinutes] = useState('120')
  const [socialLink, setSocialLink] = useState('')
  const [taskDate, setTaskDate] = useState(todayDate())
  const [creating, setCreating] = useState(false)
  const [customPoints, setCustomPoints] = useState({})
  const [awardingId, setAwardingId] = useState(null)
  const [taskFiles, setTaskFiles] = useState({})
  const [taskNotes, setTaskNotes] = useState({})
  const [submittingTaskId, setSubmittingTaskId] = useState(null)

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

  const penaltiesByTask = useMemo(() => {
    const map = {}
    for (const p of dailyTaskPenalties) {
      if (!map[p.taskId]) map[p.taskId] = []
      map[p.taskId].push(p)
    }
    return map
  }, [dailyTaskPenalties])

  const myCompletions = useMemo(() => {
    if (!modelId) return new Set()
    return new Set(
      dailyTaskCompletions.filter((c) => c.modelId === modelId).map((c) => c.taskId)
    )
  }, [dailyTaskCompletions, modelId])

  const myPenalties = useMemo(() => {
    if (!modelId) return new Set()
    return new Set(
      dailyTaskPenalties.filter((p) => p.modelId === modelId).map((p) => p.taskId)
    )
  }, [dailyTaskPenalties, modelId])

  const incompleteTasks = useMemo(() => {
    if (!isModel) return []
    return tasksForDate.filter(
      (t) =>
        !myCompletions.has(t.id) &&
        !myPenalties.has(t.id) &&
        !isTaskExpired(t.expiresAt)
    )
  }, [isModel, tasksForDate, myCompletions, myPenalties])

  // SMS ლინკიდან ავტომატური შესრულება (?complete=taskId)
  useEffect(() => {
    const completeId = searchParams.get('complete') || searchParams.get('c')
    if (!completeId || !modelId || smsAutoCompleteRef.current) return

    const task = dailyTasks.find((t) => t.id === completeId)
    if (!task) return

    smsAutoCompleteRef.current = true

    if (task.taskDate !== filterDate) setFilterDate(task.taskDate)

    if (myCompletions.has(completeId)) {
      toast.success('ამ დავალება უკვე შესრულებულია')
      setSearchParams({}, { replace: true })
      return
    }

    if (isTaskExpired(task.expiresAt)) {
      toast.error('ვადა უკვე გავიდა')
      setSearchParams({}, { replace: true })
      return
    }

    toast('ატვირთე შესრულება ქვემოთ მოცემულ box-ში', { icon: '📎' })
    setSearchParams({}, { replace: true })
    setTimeout(() => {
      document.getElementById('task-completion-box')?.scrollIntoView({ behavior: 'smooth' })
    }, 400)
  }, [searchParams, modelId, dailyTasks, myCompletions, filterDate, setSearchParams])

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
        durationMinutes: Number(durationMinutes) || 120,
        taskDate,
        createdBy: user?.displayName || 'ადმინი',
      })
      toast.success('დავალება შეიქმნა')
      setTitle('')
      setDescription('')
      setPointsReward('10')
      setDurationMinutes('120')
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

  const handleComplete = async (task, files = taskFiles[task.id] || []) => {
    if (!modelId) return toast.error('მოდელის პროფილი ვერ მოიძებნა')
    if (isTaskExpired(task.expiresAt)) {
      return toast.error('ვადა უკვე გავიდა — დავალება ვერ შესრულდება')
    }

    const note = (taskNotes[task.id] || '').trim()
    if (!files.length && !note) {
      return toast.error('ატვირთე ფოტო/სქრინი ან დაწერე ტექსტი')
    }

    setSubmittingTaskId(task.id)
    try {
      const submissionUrls = []
      for (const file of files) {
        const uploaded = await uploadImage(
          file,
          modelId,
          `task_submissions/${task.id}`
        )
        submissionUrls.push({ url: uploaded.url, name: uploaded.name })
      }

      await submitTaskCompletion({
        taskId: task.id,
        modelId,
        submissionUrls,
        submissionNote: note,
      })

      setTaskFiles((prev) => ({ ...prev, [task.id]: [] }))
      setTaskNotes((prev) => ({ ...prev, [task.id]: '' }))

      if (task.socialLink) {
        window.open(task.socialLink, '_blank', 'noopener,noreferrer')
        toast.success('ატვირთულია და მონიშნულია — გადაგიყვანთ სოცქსელში')
      } else {
        toast.success('დავალება ატვირთულია და შესრულებულად მონიშნულია')
      }
    } catch (err) {
      toast.error(err.message || 'შესრულება ვერ მოხერხდა')
    } finally {
      setSubmittingTaskId(null)
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

  const handleTimerExpire = useCallback(
    async (task) => {
      if (!modelId || myCompletions.has(task.id) || myPenalties.has(task.id)) return
      try {
        const result = await applyTaskPenalty({ taskId: task.id, modelId })
        if (result) {
          toast.error(`ვადა გავიდა — ${result.pointsDeducted} ქულა დაკლებულია`, { icon: '⏱️' })
        }
      } catch {
        /* ignore */
      }
    },
    [modelId, myCompletions, myPenalties]
  )

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: location.pathname + location.search }}
      />
    )
  }

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <PageBreadcrumb to="/dashboard" label="დაფა" />
        </FadeInItem>
        <FadeInItem>
          <PageHeader
            eyebrow="ყოველდღიური"
            icon={ListChecks}
            title="ყოველდღიური დავალებები"
            subtitle={
              isAdmin
                ? 'შექმენი დღიური დავალებები მოდელებისთვის'
                : canAward
                  ? 'შეამოწმე შესრულებული დავალებები და მიანიჭე ქულები'
                  : 'შეასრულე დღიური დავალებები და დააგროვე ქულები'
            }
            action={
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-muted)] shrink-0">თარიღი:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="elite-input !py-2 !px-3 text-sm w-full sm:w-auto"
                />
              </div>
            }
          />
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
            <Card hover={false} className="mb-6 sm:mb-8">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Plus size={18} />
                ახალი დავალება
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="elite-input-label">სათაური *</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="მაგ: Instagram Story გამოქვეყნება"
                      className="elite-input"
                    />
                  </div>
                  <div>
                    <label className="elite-input-label">თარიღი</label>
                    <input
                      type="date"
                      value={taskDate}
                      onChange={(e) => {
                        setTaskDate(e.target.value)
                        setFilterDate(e.target.value)
                      }}
                      className="elite-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="elite-input-label">აღწერა</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="დავალების დეტალები..."
                    className="elite-input resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="elite-input-label">ქულები</label>
                    <input
                      type="number"
                      min="0"
                      value={pointsReward}
                      onChange={(e) => setPointsReward(e.target.value)}
                      className="elite-input"
                    />
                  </div>
                  <div>
                    <label className="elite-input-label flex items-center gap-1">
                      <Clock size={12} />
                      ტაიმერი (წუთი)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10080"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="elite-input"
                      placeholder="120"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      {formatDuration(Number(durationMinutes) || 120)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="elite-input-label flex items-center gap-1">
                      <Instagram size={12} className="text-pink-500" />
                      სოციალური ლინკი
                    </label>
                    <input
                      type="url"
                      value={socialLink}
                      onChange={(e) => setSocialLink(e.target.value)}
                      placeholder="https://instagram.com/pear..."
                      className="elite-input"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={creating} className="w-full sm:w-auto">
                  {creating ? 'იქმნება...' : 'დავალების შექმნა'}
                </Button>
              </form>
            </Card>
          </FadeInItem>
        )}

        <FadeInItem>
          {tasksForDate.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <ListChecks size={24} />
              </div>
              <p className="empty-state-title">
                {filterDate === todayDate()
                  ? 'დღეს დავალებები ჯერ არ არის'
                  : `${formatDate(filterDate)}-ზე დავალებები არ მოიძებნა`}
              </p>
              {isAdmin && (
                <p className="empty-state-desc">
                  დაამატე ახალი დავალება ზემოთ ფორმით
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {tasksForDate.map((task) => {
                const completions = completionsByTask[task.id] || []
                const penalties = penaltiesByTask[task.id] || []
                const pending = completions.filter((c) => c.pointsAwarded == null)
                const done = completions.filter((c) => c.pointsAwarded != null)
                const iCompleted = myCompletions.has(task.id)
                const iPenalized = myPenalties.has(task.id)
                const expired = isTaskExpired(task.expiresAt)
                const taskStatusClass = iCompleted
                  ? 'task-card--done'
                  : iPenalized || expired
                    ? 'task-card--expired'
                    : 'task-card--active'

                return (
                  <motion.div
                    key={task.id}
                    layout
                    className={`rounded-2xl overflow-hidden surface-glass task-card ${taskStatusClass}`}
                  >
                    {isModel && (
                      <TaskPenaltyWatcher
                        taskId={task.id}
                        modelId={modelId}
                        expiresAt={task.expiresAt}
                        completed={iCompleted}
                        penalized={iPenalized}
                      />
                    )}

                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="font-semibold text-[var(--text-primary)] break-words">
                              {task.title}
                            </h3>
                            <span className="elite-chip shrink-0">
                              +{task.pointsReward} ქულა
                            </span>
                            {isModel && iCompleted && (
                              <span className="status-chip status-chip--success">შესრულებული</span>
                            )}
                            {isModel && iPenalized && (
                              <span className="status-chip status-chip--danger">ვადა გავიდა</span>
                            )}
                            {isModel && !iCompleted && !iPenalized && !expired && (
                              <span className="status-chip status-chip--warning">აქტიური</span>
                            )}
                            <TaskTimer
                              expiresAt={task.expiresAt}
                              size="sm"
                              onExpire={() => handleTimerExpire(task)}
                            />
                            {task.socialLink && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 flex items-center gap-1 shrink-0">
                                <Instagram size={10} />
                                სოც. ლინკი
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-[var(--text-muted)] mt-1 break-words">
                              {task.description}
                            </p>
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
                          <p className="text-[10px] text-[var(--text-muted)] mt-2 flex flex-wrap gap-x-2 gap-y-1">
                            <span>{formatDate(task.taskDate)}</span>
                            <span>·</span>
                            <span>{completions.length} შესრულება</span>
                            <span>·</span>
                            <span>{formatDuration(task.durationMinutes)} ტაიმერი</span>
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

                      {isModel && iCompleted && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--accent-bright)]">
                          <CheckCircle2 size={16} />
                          შენ უკვე შეასრულე ეს დავალება
                        </div>
                      )}

                      {isModel && iPenalized && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-red-500">
                          <AlertTriangle size={16} />
                          ვადა გავიდა — ქულები დაკლებულია
                        </div>
                      )}

                      {isModel && expired && !iCompleted && !iPenalized && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
                          <Clock size={16} />
                          ვადა გავიდა
                        </div>
                      )}
                    </div>

                    {canAward && (pending.length > 0 || done.length > 0 || penalties.length > 0) && (
                      <div
                        className="px-4 sm:px-5 py-4 border-t space-y-3"
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
                                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl surface-glass"
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
                                      {c.submissionUrls?.length > 0 && (
                                        <span className="text-[var(--accent)]">
                                          · {c.submissionUrls.length} ფაილი
                                        </span>
                                      )}
                                      {c.submissionNote && (
                                        <span className="text-[var(--accent)]">· ტექსტი</span>
                                      )}
                                    </p>
                                    {c.submissionNote && (
                                      <p
                                        className="text-xs text-[var(--text-muted)] mt-1.5 break-words line-clamp-3"
                                        title={c.submissionNote}
                                      >
                                        {c.submissionNote}
                                      </p>
                                    )}
                                    {c.submissionUrls?.length > 0 && (
                                      <div className="flex gap-1.5 mt-2 flex-wrap">
                                        {c.submissionUrls.map((sub, idx) => (
                                          <a
                                            key={idx}
                                            href={sub.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-12 h-12 rounded-lg overflow-hidden border shrink-0"
                                            style={{ borderColor: 'var(--border-subtle)' }}
                                          >
                                            <img
                                              src={sub.url}
                                              alt={sub.name || 'submission'}
                                              className="w-full h-full object-cover"
                                            />
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
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
                                    className="w-16 px-2 py-1.5 rounded-lg text-sm border text-center glass text-[var(--text-primary)]"
                                    style={{ borderColor: 'var(--border-subtle)' }}
                                  />
                                  <Button
                                    size="sm"
                                    disabled={awardingId === c.id}
                                    onClick={() => handleAward(c, task.pointsReward)}
                                    className="flex-1 sm:flex-none"
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
                                  {c.submissionNote && (
                                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-2">
                                      {c.submissionNote}
                                    </p>
                                  )}
                                  {c.submissionUrls?.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                      {c.submissionUrls.slice(0, 3).map((sub, idx) => (
                                        <a
                                          key={idx}
                                          href={sub.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <img
                                            src={sub.url}
                                            alt=""
                                            className="w-8 h-8 rounded object-cover border"
                                            style={{ borderColor: 'var(--border-subtle)' }}
                                          />
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs font-bold text-[var(--accent-bright)] flex items-center gap-1 shrink-0">
                                  <CheckCircle2 size={12} />
                                  +{c.pointsAwarded} ქულა
                                </span>
                              </div>
                            )
                          })}

                          {penalties.map((p) => {
                            const model = models.find((m) => m.id === p.modelId)
                            return (
                              <div
                                key={p.id}
                                className="flex items-center gap-3 p-3 rounded-xl opacity-80"
                              >
                                <ModelAvatar
                                  src={model?.avatar}
                                  name={model?.name}
                                  size="xs"
                                  className="!rounded-lg shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[var(--text-primary)] truncate">
                                    {model?.name || p.modelId}
                                  </p>
                                  <p className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
                                    <AlertTriangle size={9} />
                                    ვადა გავიდა
                                  </p>
                                </div>
                                <span className="text-xs font-bold text-red-500 flex items-center gap-1 shrink-0">
                                  −{p.pointsDeducted} ქულა
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

        {isModel && (
          <FadeInItem>
            <div
              id="task-completion-box"
              className="elite-panel elite-panel-glow mt-8 p-5 sm:p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={20} className="text-[var(--accent)] shrink-0" />
                <h2 className="section-title !mb-0">დავალების შესრულება</h2>
              </div>
              <p className="section-subtitle mb-5">
                ატვირთე ფოტო/სქრინი ან დაწერე ტექსტი (ან ორივე), შემდეგ დააჭირე
                „შესრულება“. SMS ლინკიდან შესვლისასაც აქ შეგიძლია გაგზავნა.
              </p>

              {incompleteTasks.length === 0 ? (
                <div className="empty-state !py-8">
                  <p className="empty-state-desc">
                    ყველა დავალება შესრულებულია ან ვადა გავიდა
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incompleteTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border p-4 space-y-4"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        background: 'var(--glass-bg-subtle)',
                      }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="elite-chip">+{task.pointsReward} ქულა</span>
                            <TaskTimer expiresAt={task.expiresAt} size="sm" />
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="elite-input-label mb-2 flex items-center gap-1">
                          <MessageSquare size={12} />
                          ტექსტი (არასავალდებულო)
                        </p>
                        <textarea
                          value={taskNotes[task.id] || ''}
                          onChange={(e) =>
                            setTaskNotes((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          disabled={submittingTaskId === task.id}
                          placeholder="მაგ: ლინკი, კომენტარი ან შესრულების აღწერა..."
                          rows={3}
                          className="elite-input resize-none"
                        />
                      </div>

                      <div>
                        <p className="elite-input-label mb-2 flex items-center gap-1">
                          <Upload size={12} />
                          ფოტო / სქრინი (არასავალდებულო)
                        </p>
                        <TaskSubmissionZone
                          compact
                          disabled={submittingTaskId === task.id}
                          onFilesChange={(files) =>
                            setTaskFiles((prev) => ({ ...prev, [task.id]: files }))
                          }
                        />
                      </div>

                      <Button
                        size="sm"
                        disabled={submittingTaskId === task.id}
                        loading={submittingTaskId === task.id}
                        onClick={() => handleComplete(task)}
                        className="w-full sm:w-auto"
                      >
                        {task.socialLink ? (
                          <>
                            <Link2 size={14} />
                            ატვირთვა, შესრულება და გადასვლა
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            ატვირთვა და შესრულება
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FadeInItem>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
