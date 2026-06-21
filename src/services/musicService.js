import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'

export const BG_MUSIC_KEY = 'bg_music'
const LOCAL_KEY = 'pear_bg_music_config'
const REALTIME_CHANNEL = 'pear-bg-music-v1'

export const DEFAULT_BG_MUSIC = {
  url: 'https://youtu.be/CDG_y0nR3Qg',
  volume: 0.5,
  enabled: true,
}

const listeners = new Set()
let realtimeChannel = null
let localPollInterval = null

function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_BG_MUSIC }
  const url = typeof raw.url === 'string' ? raw.url.trim() : DEFAULT_BG_MUSIC.url
  const volume =
    typeof raw.volume === 'number' && raw.volume >= 0 && raw.volume <= 1
      ? raw.volume
      : DEFAULT_BG_MUSIC.volume
  return {
    url: url || DEFAULT_BG_MUSIC.url,
    volume,
    enabled: raw.enabled !== false,
  }
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? normalizeConfig(JSON.parse(raw)) : { ...DEFAULT_BG_MUSIC }
  } catch {
    return { ...DEFAULT_BG_MUSIC }
  }
}

function writeLocal(config) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(normalizeConfig(config)))
}

function notifyListeners(config) {
  listeners.forEach((cb) => {
    try {
      cb(config)
    } catch {
      /* ignore */
    }
  })
}

async function refreshFromRemote() {
  if (!isConfigured || !supabase) {
    notifyListeners(readLocal())
    return
  }

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', BG_MUSIC_KEY)
    .maybeSingle()

  if (error || !data?.value) {
    notifyListeners({ ...DEFAULT_BG_MUSIC })
    return
  }

  notifyListeners(normalizeConfig(data.value))
}

function startLocalPolling() {
  if (localPollInterval) return
  notifyListeners(readLocal())
  localPollInterval = setInterval(() => notifyListeners(readLocal()), 1000)
}

function stopLocalPolling() {
  if (!localPollInterval) return
  clearInterval(localPollInterval)
  localPollInterval = null
}

function startRealtimeChannel() {
  if (!isConfigured || !supabase || realtimeChannel) return

  realtimeChannel = supabase
    .channel(REALTIME_CHANNEL)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'settings',
        filter: `key=eq.${BG_MUSIC_KEY}`,
      },
      () => refreshFromRemote()
    )
    .subscribe()
}

function stopRealtimeChannel() {
  if (!realtimeChannel || !supabase) return
  supabase.removeChannel(realtimeChannel)
  realtimeChannel = null
}

function ensureSubscription() {
  if (!isConfigured || !supabase) {
    startLocalPolling()
    return
  }
  startRealtimeChannel()
  refreshFromRemote()
}

function releaseSubscription() {
  if (listeners.size > 0) return
  stopLocalPolling()
  stopRealtimeChannel()
}

export function subscribeToBgMusic(callback) {
  listeners.add(callback)
  ensureSubscription()

  return () => {
    listeners.delete(callback)
    releaseSubscription()
  }
}

export async function fetchBgMusic() {
  if (!isConfigured || !supabase) return readLocal()

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', BG_MUSIC_KEY)
    .maybeSingle()

  if (error || !data?.value) return { ...DEFAULT_BG_MUSIC }
  return normalizeConfig(data.value)
}

export async function saveBgMusic(config) {
  const normalized = normalizeConfig(config)

  if (!isConfigured || !supabase) {
    writeLocal(normalized)
    notifyListeners(normalized)
    return normalized
  }

  const { error } = await supabase.from('settings').upsert({
    key: BG_MUSIC_KEY,
    value: normalized,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
  notifyListeners(normalized)
  return normalized
}
