import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { adjustModelPoints } from './pointsService'
import { logActivityEntry } from './activityService'
import { useUserStore } from '../store/useUserStore'

const TASKS_KEY = 'pear_daily_tasks'
const COMPLETIONS_KEY = 'pear_daily_task_completions'
const PENALTIES_KEY = 'pear_daily_task_penalties'

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function getLocalTasks() {
  const data = localStorage.getItem(TASKS_KEY)
  if (!data) return []
  return JSON.parse(data)
}

function saveLocalTasks(tasks) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  useUserStore.getState().syncDailyTasks(tasks.map(rowToTask))
}

function getLocalCompletions() {
  const data = localStorage.getItem(COMPLETIONS_KEY)
  if (!data) return []
  return JSON.parse(data)
}

function saveLocalCompletions(completions) {
  localStorage.setItem(COMPLETIONS_KEY, JSON.stringify(completions))
  useUserStore.getState().syncDailyTaskCompletions(completions.map(rowToCompletion))
}

function getLocalPenalties() {
  const data = localStorage.getItem(PENALTIES_KEY)
  if (!data) return []
  return JSON.parse(data)
}

function saveLocalPenalties(penalties) {
  localStorage.setItem(PENALTIES_KEY, JSON.stringify(penalties))
  useUserStore.getState().syncDailyTaskPenalties(penalties.map(rowToPenalty))
}

function computeExpiresAt(createdAt, durationMinutes) {
  const base = createdAt ? new Date(createdAt).getTime() : Date.now()
  const mins = Math.max(1, Number(durationMinutes) || 120)
  return new Date(base + mins * 60 * 1000).toISOString()
}

function rowToTask(row) {
  const durationMinutes = row.duration_minutes ?? row.durationMinutes ?? 120
  const createdAt = row.created_at ?? row.createdAt
  const expiresAt =
    row.expires_at ??
    row.expiresAt ??
    computeExpiresAt(createdAt, durationMinutes)

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    socialLink: row.social_link ?? row.socialLink ?? null,
    pointsReward: row.points_reward ?? row.pointsReward ?? 0,
    taskDate: row.task_date ?? row.taskDate ?? todayDate(),
    durationMinutes,
    expiresAt,
    createdAt,
    createdBy: row.created_by ?? row.createdBy ?? 'ადმინი',
  }
}

function rowToPenalty(row) {
  return {
    id: row.id,
    taskId: row.task_id ?? row.taskId,
    modelId: row.model_id ?? row.modelId,
    pointsDeducted: row.points_deducted ?? row.pointsDeducted ?? 0,
    penalizedAt: row.penalized_at ?? row.penalizedAt,
  }
}

function rowToCompletion(row) {
  return {
    id: row.id,
    taskId: row.task_id ?? row.taskId,
    modelId: row.model_id ?? row.modelId,
    socialAccount: row.social_account ?? row.socialAccount ?? null,
    completedAt: row.completed_at ?? row.completedAt,
    pointsAwarded: row.points_awarded ?? row.pointsAwarded ?? null,
    awardedBy: row.awarded_by ?? row.awardedBy ?? null,
  }
}

export function subscribeToDailyTasks(callback) {
  if (!isConfigured || !supabase) {
    const refresh = () => {
      callback(getLocalTasks().map(rowToTask))
    }
    refresh()
    const interval = setInterval(refresh, 1000)
    return () => clearInterval(interval)
  }

  const refresh = async () => {
    const { data, error } = await supabase
      .from('daily_tasks')
      .select('*')
      .order('task_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      callback([])
      return
    }
    callback((data || []).map(rowToTask))
  }

  refresh()

  const channel = supabase
    .channel('daily-tasks-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToDailyTaskCompletions(callback) {
  if (!isConfigured || !supabase) {
    const refresh = () => {
      callback(getLocalCompletions().map(rowToCompletion))
    }
    refresh()
    const interval = setInterval(refresh, 1000)
    return () => clearInterval(interval)
  }

  const refresh = async () => {
    const { data, error } = await supabase
      .from('daily_task_completions')
      .select('*')
      .order('completed_at', { ascending: false })

    if (error) {
      callback([])
      return
    }
    callback((data || []).map(rowToCompletion))
  }

  refresh()

  const channel = supabase
    .channel('daily-task-completions-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_task_completions' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToDailyTaskPenalties(callback) {
  if (!isConfigured || !supabase) {
    const refresh = () => {
      callback(getLocalPenalties().map(rowToPenalty))
    }
    refresh()
    const interval = setInterval(refresh, 1000)
    return () => clearInterval(interval)
  }

  const refresh = async () => {
    const { data, error } = await supabase
      .from('daily_task_penalties')
      .select('*')
      .order('penalized_at', { ascending: false })

    if (error) {
      callback([])
      return
    }
    callback((data || []).map(rowToPenalty))
  }

  refresh()

  const channel = supabase
    .channel('daily-task-penalties-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_task_penalties' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function createDailyTask({
  title,
  description,
  socialLink = '',
  pointsReward = 10,
  taskDate = todayDate(),
  durationMinutes = 120,
  createdBy = 'ადმინი',
}) {
  if (!title?.trim()) throw new Error('სათაური აუცილებელია')

  const link = socialLink?.trim() || null
  const mins = Math.min(10080, Math.max(1, Number(durationMinutes) || 120))
  const createdAt = new Date().toISOString()
  const expiresAt = computeExpiresAt(createdAt, mins)

  const payload = {
    title: title.trim(),
    description: description?.trim() || '',
    social_link: link,
    points_reward: Math.max(0, Number(pointsReward) || 0),
    task_date: taskDate || todayDate(),
    duration_minutes: mins,
    expires_at: expiresAt,
    created_by: createdBy,
  }

  if (!isConfigured || !supabase) {
    const id = `local_task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const stored = [{ id, created_at: createdAt, ...payload }, ...getLocalTasks()]
    saveLocalTasks(stored)
    return rowToTask(stored[0])
  }

  const { data, error } = await supabase.from('daily_tasks').insert(payload).select().single()
  if (error) throw error
  return rowToTask(data)
}

export async function deleteDailyTask(taskId) {
  if (!taskId) throw new Error('დავალების ID აუცილებელია')

  if (!isConfigured || !supabase) {
    saveLocalTasks(getLocalTasks().filter((t) => t.id !== taskId))
    saveLocalCompletions(getLocalCompletions().filter((c) => c.task_id !== taskId && c.taskId !== taskId))
    saveLocalPenalties(getLocalPenalties().filter((p) => p.task_id !== taskId && p.taskId !== taskId))
    return
  }

  const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId)
  if (error) throw error
}

export async function submitTaskCompletion({ taskId, modelId }) {
  if (!taskId || !modelId) throw new Error('მონაცემები არასრულია')

  const existing = getLocalCompletions().find(
    (c) => (c.task_id ?? c.taskId) === taskId && (c.model_id ?? c.modelId) === modelId
  )
  if ((!isConfigured || !supabase) && existing) {
    throw new Error('ამ დავალება უკვე შესრულებული გაქვთ')
  }

  const payload = {
    task_id: taskId,
    model_id: modelId,
    social_account: null,
    completed_at: new Date().toISOString(),
    points_awarded: null,
    awarded_by: null,
  }

  if (!isConfigured || !supabase) {
    if (existing) throw new Error('ამ დავალება უკვე შესრულებული გაქვთ')
    const id = `local_completion_${Date.now()}`
    const stored = [{ id, ...payload }, ...getLocalCompletions()]
    saveLocalCompletions(stored)
    return rowToCompletion(stored[0])
  }

  const { data: dup } = await supabase
    .from('daily_task_completions')
    .select('id')
    .eq('task_id', taskId)
    .eq('model_id', modelId)
    .maybeSingle()

  if (dup) throw new Error('ამ დავალება უკვე შესრულებული გაქვთ')

  const { data, error } = await supabase
    .from('daily_task_completions')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return rowToCompletion(data)
}

export async function awardTaskPoints({ completionId, points, awardedBy }) {
  if (!completionId) throw new Error('შესრულების ID აუცილებელია')

  if (!isConfigured || !supabase) {
    const completions = getLocalCompletions()
    const idx = completions.findIndex((c) => c.id === completionId)
    if (idx === -1) throw new Error('შესრულება ვერ მოიძებნა')
    if (completions[idx].points_awarded != null || completions[idx].pointsAwarded != null) {
      throw new Error('ქულები უკვე მინიჭებულია')
    }

    const modelId = completions[idx].model_id ?? completions[idx].modelId
    const taskId = completions[idx].task_id ?? completions[idx].taskId
    const task = getLocalTasks().find((t) => t.id === taskId)
    const reward = Math.max(0, Number(points) ?? task?.points_reward ?? task?.pointsReward ?? 0)

    completions[idx].points_awarded = reward
    completions[idx].awarded_by = awardedBy
    saveLocalCompletions(completions)

    useUserStore.getState().addPoints(modelId, reward)
    return rowToCompletion(completions[idx])
  }

  const { data: completion, error: readErr } = await supabase
    .from('daily_task_completions')
    .select('*, daily_tasks(points_reward)')
    .eq('id', completionId)
    .single()

  if (readErr) throw readErr
  if (completion.points_awarded != null) throw new Error('ქულები უკვე მინიჭებულია')

  const reward = Math.max(
    0,
    Number(points) ?? completion.daily_tasks?.points_reward ?? 0
  )

  const { data: updated, error: writeErr } = await supabase
    .from('daily_task_completions')
    .update({ points_awarded: reward, awarded_by: awardedBy })
    .eq('id', completionId)
    .select()
    .single()

  if (writeErr) throw writeErr

  await adjustModelPoints(completion.model_id, reward)

  const modelName = useUserStore.getState().getModelById(completion.model_id)?.name || completion.model_id
  await logActivityEntry(
    `ყოველდღიური დავალება (+${reward} ქულა) — ${modelName}`,
    awardedBy || 'ადმინი'
  )

  return rowToCompletion(updated)
}

export async function applyTaskPenalty({ taskId, modelId }) {
  if (!taskId || !modelId) throw new Error('მონაცემები არასრულია')

  const tasks = !isConfigured || !supabase ? getLocalTasks() : null
  let taskRow = tasks?.find((t) => t.id === taskId)

  if (!taskRow && isConfigured && supabase) {
    const { data, error } = await supabase.from('daily_tasks').select('*').eq('id', taskId).single()
    if (error) throw error
    taskRow = data
  }

  if (!taskRow) throw new Error('დავალება ვერ მოიძებნა')

  const task = rowToTask(taskRow)
  const expiresAt = new Date(task.expiresAt).getTime()
  if (Date.now() < expiresAt) return null

  const pointsDeducted = Math.max(0, task.pointsReward)
  if (pointsDeducted === 0) return null

  if (!isConfigured || !supabase) {
    const existingCompletion = getLocalCompletions().find(
      (c) => (c.task_id ?? c.taskId) === taskId && (c.model_id ?? c.modelId) === modelId
    )
    if (existingCompletion) return null

    const existingPenalty = getLocalPenalties().find(
      (p) => (p.task_id ?? p.taskId) === taskId && (p.model_id ?? p.modelId) === modelId
    )
    if (existingPenalty) return rowToPenalty(existingPenalty)

    const id = `local_penalty_${Date.now()}`
    const penalizedAt = new Date().toISOString()
    const stored = [
      {
        id,
        task_id: taskId,
        model_id: modelId,
        points_deducted: pointsDeducted,
        penalized_at: penalizedAt,
      },
      ...getLocalPenalties(),
    ]
    saveLocalPenalties(stored)
    useUserStore.getState().addPoints(modelId, -pointsDeducted)
    return rowToPenalty(stored[0])
  }

  const { data: completion } = await supabase
    .from('daily_task_completions')
    .select('id')
    .eq('task_id', taskId)
    .eq('model_id', modelId)
    .maybeSingle()

  if (completion) return null

  const { data: penaltyDup } = await supabase
    .from('daily_task_penalties')
    .select('id')
    .eq('task_id', taskId)
    .eq('model_id', modelId)
    .maybeSingle()

  if (penaltyDup) return null

  const { data: penalty, error: penaltyErr } = await supabase
    .from('daily_task_penalties')
    .insert({
      task_id: taskId,
      model_id: modelId,
      points_deducted: pointsDeducted,
    })
    .select()
    .single()

  if (penaltyErr) throw penaltyErr

  await adjustModelPoints(modelId, -pointsDeducted)

  const modelName = useUserStore.getState().getModelById(modelId)?.name || modelId
  await logActivityEntry(
    `ყოველდღიური დავალება (−${pointsDeducted} ქულა, ვადა გავიდა) — ${modelName}`,
    'სისტემა'
  )

  return rowToPenalty(penalty)
}
