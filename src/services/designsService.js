import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { uploadImage } from './storage'
import { adjustModelPoints } from './pointsService'
import { logActivityEntry } from './activityService'
import { useUserStore } from '../store/useUserStore'

const LOCAL_KEY = 'pear_designs'

function getLocalDesigns() {
  const data = localStorage.getItem(LOCAL_KEY)
  return data ? JSON.parse(data) : []
}

function saveLocalDesigns(designs) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(designs))
  useUserStore.getState().syncDesigns(designs)
}

function rowToDesign(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    modelId: row.model_id,
    senderName: row.sender_name,
    pointsAwarded: row.points_awarded,
    createdAt: row.created_at,
  }
}

export function subscribeToDesigns(callback) {
  if (!isConfigured || !supabase) {
    const local = getLocalDesigns()
    callback(local)
    const interval = setInterval(() => {
      callback(getLocalDesigns())
    }, 1000)
    return () => clearInterval(interval)
  }

  const refresh = async () => {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      callback([])
      return
    }
    callback((data || []).map(rowToDesign))
  }

  refresh()

  const channel = supabase
    .channel('designs-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'designs' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function submitDesign({ title, description, file, modelId, senderName }) {
  if (!title.trim() || !file || !modelId) {
    throw new Error('სათაური და ფაილი აუცილებელია')
  }

  // Upload image
  const uploaded = await uploadImage(file, modelId, 'designs')
  const imageUrl = uploaded.url

  const design = {
    title: title.trim(),
    description: (description || '').trim(),
    image_url: imageUrl,
    model_id: modelId,
    sender_name: senderName || modelId,
    points_awarded: 50,
  }

  let finalDesign
  if (!isConfigured || !supabase) {
    const id = `local_design_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const createdAt = new Date().toISOString()
    const stored = [
      { id, created_at: createdAt, ...design },
      ...getLocalDesigns(),
    ].map(rowToDesign)
    saveLocalDesigns(stored)
    finalDesign = stored[0]

    // Award points
    useUserStore.getState().addPoints(modelId, 50)
  } else {
    // Insert into DB
    const { data, error } = await supabase
      .from('designs')
      .insert(design)
      .select()
      .single()

    if (error) throw error
    finalDesign = rowToDesign(data)

    // Award points
    await adjustModelPoints(modelId, 50)
    await logActivityEntry(`ატვირთა დიზაინი: ${title.trim()} (+50 ქულა)`, senderName)
  }

  return finalDesign
}

export async function deleteDesign(id, modelId) {
  if (!isConfigured || !supabase) {
    const designs = getLocalDesigns()
    saveLocalDesigns(designs.filter((d) => d.id !== id))
    return
  }

  const { error } = await supabase.from('designs').delete().eq('id', id)
  if (error) throw error
}
