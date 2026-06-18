import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { logActivityEntry } from './activityService'

const CV_KEY = 'pear_cv_submissions'

function getLocalCVs() {
  try {
    const raw = localStorage.getItem(CV_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalCVs(list) {
  localStorage.setItem(CV_KEY, JSON.stringify(list))
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function normalizeCV(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    fileName: row.file_name ?? row.fileName ?? null,
    fileUrl: row.file_url ?? row.fileUrl ?? null,
    fileData: row.file_data ?? row.fileData ?? null,
    fileMime: row.file_mime ?? row.fileMime ?? null,
    modelId: row.model_id ?? row.modelId ?? null,
    created_at: row.created_at ?? row.createdAt,
  }
}

export async function submitCV({ name, email, message, file, modelId }) {
  const id = `cv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const created_at = new Date().toISOString()

  let fileData = null
  let fileMime = null
  if (file) {
    fileData = await fileToBase64(file)
    fileMime = file.type || 'application/octet-stream'
  }

  const entry = normalizeCV({
    id,
    name: name?.trim() || null,
    email: email?.trim() || null,
    message: message?.trim() || null,
    file_name: file?.name || null,
    file_url: null,
    file_data: fileData,
    file_mime: fileMime,
    model_id: modelId || null,
    created_at,
  })

  if (!isConfigured || !supabase) {
    const list = getLocalCVs()
    list.unshift(entry)
    saveLocalCVs(list)
    try {
      await logActivityEntry(
        `CV მიღებულია: ${entry.fileName || '(ფაილის გარეშე)'} — ${entry.name || entry.email || 'ანონიმი'}`
      )
    } catch {
      /* offline */
    }
    return entry
  }

  try {
    let fileUrl = null
    if (file) {
      const filePath = `cv-uploads/${id}_${file.name}`
      const { error: uploadErr } = await supabase.storage.from('pear-images').upload(filePath, file, {
        upsert: true,
        contentType: file.type || undefined,
      })
      if (uploadErr) throw uploadErr
      const { data: urlData } = supabase.storage.from('pear-images').getPublicUrl(filePath)
      fileUrl = urlData?.publicUrl || null
    }

    const { data, error } = await supabase
      .from('cv_submissions')
      .insert({
        id,
        name: entry.name,
        email: entry.email,
        message: entry.message,
        file_name: entry.fileName,
        file_url: fileUrl,
        model_id: entry.modelId,
        created_at,
      })
      .select()
      .single()

    if (error) throw error

    await logActivityEntry(
      `CV მიღებულია: ${data.file_name || '(ფაილის გარეშე)'} — ${data.name || data.email || 'ანონიმი'}`
    )
    return normalizeCV(data)
  } catch (err) {
    const list = getLocalCVs()
    list.unshift(entry)
    saveLocalCVs(list)
    try {
      await logActivityEntry(
        `CV (ლოკალური): ${entry.fileName || '(ფაილის გარეშე)'} — ${entry.name || entry.email || 'ანონიმი'}`
      )
    } catch {
      /* offline */
    }
    return entry
  }
}

export async function fetchCVSubmissions() {
  if (!isConfigured || !supabase) {
    return getLocalCVs().map(normalizeCV)
  }

  try {
    const { data, error } = await supabase
      .from('cv_submissions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    const remote = (data || []).map(normalizeCV)
    if (remote.length > 0) return remote
    return getLocalCVs().map(normalizeCV)
  } catch {
    return getLocalCVs().map(normalizeCV)
  }
}

export function getCVSubmissions() {
  return getLocalCVs().map(normalizeCV)
}

export function downloadCV(cv) {
  const fileName = cv.fileName || cv.file_name || 'cv-document'
  const fileData = cv.fileData || cv.file_data
  const fileUrl = cv.fileUrl || cv.file_url

  if (fileData) {
    const link = document.createElement('a')
    link.href = fileData
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  }

  if (fileUrl) {
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = fileName
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  }

  return false
}

export function openCV(cv) {
  const fileData = cv.fileData || cv.file_data
  const fileUrl = cv.fileUrl || cv.file_url
  if (fileData) {
    window.open(fileData, '_blank', 'noopener,noreferrer')
    return true
  }
  if (fileUrl) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer')
    return true
  }
  return false
}
