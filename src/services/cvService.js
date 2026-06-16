import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { logActivityEntry } from './activityService'

const CV_KEY = 'pear_cv_submissions'

function getLocalCVs() {
  const raw = localStorage.getItem(CV_KEY)
  return raw ? JSON.parse(raw) : []
}

function saveLocalCVs(list) {
  localStorage.setItem(CV_KEY, JSON.stringify(list))
}

export async function submitCV({ name, email, message, file, modelId }) {
  const entry = {
    id: `cv_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    name: name || null,
    email: email || null,
    message: message || null,
    fileName: file?.name || null,
    created_at: new Date().toISOString(),
    modelId: modelId || null,
  }

  if (!isConfigured || !supabase) {
    const list = getLocalCVs()
    list.unshift(entry)
    saveLocalCVs(list)
    try {
      await logActivityEntry(`CV მომენტი: ${entry.fileName || '(no file)'} - ${entry.name || entry.email || 'anon'}`)
    } catch {}
    return entry
  }

  // If supabase is configured, try to upload file and insert record
  try {
    let fileUrl = null
    if (file) {
      const filePath = `cv-uploads/${entry.id}_${file.name}`
      const { error: uploadErr } = await supabase.storage.from('cv-uploads').upload(filePath, file)
      if (uploadErr) throw uploadErr
      const { publicURL } = supabase.storage.from('cv-uploads').getPublicUrl(filePath)
      fileUrl = publicURL
    }

    const { data, error } = await supabase
      .from('cv_submissions')
      .insert({
        id: entry.id,
        name: entry.name,
        email: entry.email,
        message: entry.message,
        file_name: entry.fileName,
        file_url: fileUrl,
        model_id: entry.modelId,
        created_at: entry.created_at,
      })
      .select()
      .single()

    if (error) throw error

    await logActivityEntry(`CV მიღებულია: ${data.file_name || '(no file)'} - ${data.name || data.email || 'anon'}`)
    return data
  } catch (err) {
    // fallback to local
    const list = getLocalCVs()
    list.unshift(entry)
    saveLocalCVs(list)
    try {
      await logActivityEntry(`CV (fallback) მიღებულია: ${entry.fileName || '(no file)'} - ${entry.name || entry.email || 'anon'}`)
    } catch {}
    return entry
  }
}

export function getCVSubmissions() {
  if (!isConfigured || !supabase) return getLocalCVs()
  // For now, return local cache — production should fetch from database
  return getLocalCVs()
}
