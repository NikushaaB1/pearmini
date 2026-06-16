import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { adjustModelPoints } from './pointsService'
import { logActivityEntry } from './activityService'
import { useUserStore } from '../store/useUserStore'

const BILLBOARD_LOCAL_KEY = 'pear_billboard_model_id'

export function subscribeToBillboard(callback) {
  if (!isConfigured || !supabase) {
    const val = localStorage.getItem(BILLBOARD_LOCAL_KEY) || null
    callback(val)
    const interval = setInterval(() => {
      callback(localStorage.getItem(BILLBOARD_LOCAL_KEY) || null)
    }, 1000)
    return () => clearInterval(interval)
  }

  const refresh = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'billboard_model_id')
      .maybeSingle()

    if (error || !data) {
      callback(null)
      return
    }
    callback(data.value?.modelId || null)
  }

  refresh()

  const channel = supabase
    .channel('settings-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function redeemReward(modelId, reward) {
  const points = useUserStore.getState().points[modelId] || 0
  if (points < reward.cost) {
    throw new Error('არ გაქვთ საკმარისი ქულა')
  }

  const modelName = useUserStore.getState().getModelById(modelId)?.name || modelId

  if (!isConfigured || !supabase) {
    useUserStore.getState().addPoints(modelId, -reward.cost)

    useUserStore.getState().logActivity(
      `გადაცვალა ქულები საჩუქარში: "${reward.title}" (-${reward.cost} ქულა)`,
      modelName
    )

    if (reward.id === 'billboard') {
      localStorage.setItem(BILLBOARD_LOCAL_KEY, modelId)
      useUserStore.getState().syncBillboardModelId(modelId)
    }

    if (reward.id === 'boost_50') {
      useUserStore.getState().addPoints(modelId, 50)
    }
    return
  }

  await adjustModelPoints(modelId, -reward.cost)

  if (reward.id === 'billboard') {
    const { error: settingsErr } = await supabase
      .from('settings')
      .upsert({
        key: 'billboard_model_id',
        value: { modelId },
        updated_at: new Date().toISOString(),
      })
    if (settingsErr) throw settingsErr
  }

  if (reward.id === 'boost_50') {
    await adjustModelPoints(modelId, 50)
  }

  await logActivityEntry(
    `გადაცვალა ქულები საჩუქარში: "${reward.title}" (-${reward.cost} ქულა)`,
    modelName
  )
}
