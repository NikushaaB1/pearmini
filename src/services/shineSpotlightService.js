import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'

export const SHINE_SPOTLIGHT_KEY = 'shine_spotlight'
const LOCAL_KEY = 'pear_shine_spotlight'
const REALTIME_CHANNEL = 'pear-shine-spotlight-v1'

const CAMPAIGN_BODY = `PEAR გაძლევს შესაძლებლობას, გახდე ჩვენი შემდეგი სარეკლამო კამპანიის სახე.

შენი ფოტო განთავსდება ბათუმში, 26 მაისის ქუჩაზე, PEAR-ის დიდ ბანერზე — ერთ-ერთ ყველაზე ხალხმრავალ ადგილას, რომელსაც ყოველდღიურად ათასობით ადამიანი ხედავს.

ეს არის შანსი, რომ გამოჩნდე, წარმოაჩინო საკუთარი თავი და გახდე იმ პროექტის ნაწილი, რომელსაც მთელი ქალაქი შეამჩნევს.

ჩვენ ვეძებთ ადამიანებს, რომლებიც გამოირჩევიან თავდაჯერებულობით, შრომით, მონდომებითა და სურვილით, იყვნენ გამორჩეულები.

შესაძლოა, სულ მალე სწორედ შენი სახე იყოს ის, რომელსაც ბათუმი ყოველდღე დაინახავს.

ახლა შენი დროა იბრწყინო.

---
დღეს შენ უყურებ ბანერებს.
ხვალ, შესაძლოა, ბანერიდან შენ გიყურებდნენ.`

export const DEFAULT_SHINE_SPOTLIGHT = {
  enabled: true,
  title: '🌟 შენი დრო დადგა.',
  subtitle: 'PEAR გაძლევს შესაძლებლობას, გახდე ჩვენი შემდეგი სარეკლამო კამპანიის სახე.',
  description: CAMPAIGN_BODY,
  imageUrl: null,
}

const listeners = new Set()
let realtimeChannel = null
let localPollInterval = null

function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SHINE_SPOTLIGHT }
  return {
    enabled: raw.enabled !== false,
    title: raw.title?.trim() || DEFAULT_SHINE_SPOTLIGHT.title,
    subtitle: raw.subtitle?.trim() || DEFAULT_SHINE_SPOTLIGHT.subtitle,
    description: raw.description?.trim() || DEFAULT_SHINE_SPOTLIGHT.description,
    imageUrl: raw.imageUrl || null,
  }
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? normalizeConfig(JSON.parse(raw)) : { ...DEFAULT_SHINE_SPOTLIGHT }
  } catch {
    return { ...DEFAULT_SHINE_SPOTLIGHT }
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
      /* ignore listener errors */
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
    .eq('key', SHINE_SPOTLIGHT_KEY)
    .maybeSingle()

  if (error || !data?.value) {
    notifyListeners({ ...DEFAULT_SHINE_SPOTLIGHT })
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
        filter: `key=eq.${SHINE_SPOTLIGHT_KEY}`,
      },
      () => {
        refreshFromRemote()
      }
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

export function subscribeToShineSpotlight(callback) {
  listeners.add(callback)
  ensureSubscription()

  return () => {
    listeners.delete(callback)
    releaseSubscription()
  }
}

export async function fetchShineSpotlight() {
  if (!isConfigured || !supabase) return readLocal()

  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', SHINE_SPOTLIGHT_KEY)
    .maybeSingle()

  if (error || !data?.value) return { ...DEFAULT_SHINE_SPOTLIGHT }
  return normalizeConfig(data.value)
}

export async function saveShineSpotlight(config) {
  const normalized = normalizeConfig(config)

  if (!isConfigured || !supabase) {
    writeLocal(normalized)
    notifyListeners(normalized)
    return normalized
  }

  const { error } = await supabase.from('settings').upsert({
    key: SHINE_SPOTLIGHT_KEY,
    value: normalized,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
  notifyListeners(normalized)
  return normalized
}

export const SHINE_WELCOME_SESSION_KEY = 'pear_shine_welcome_seen'

export function hasSeenShineWelcome() {
  try {
    return sessionStorage.getItem(SHINE_WELCOME_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function markShineWelcomeSeen() {
  try {
    sessionStorage.setItem(SHINE_WELCOME_SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function resetShineWelcomeSeen() {
  try {
    sessionStorage.removeItem(SHINE_WELCOME_SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function parseCampaignDescription(description) {
  const [body, closing] = description.split('\n\n---\n\n')
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const closingLines = closing
    ? closing.split('\n').map((l) => l.trim()).filter(Boolean)
    : []

  return { paragraphs, closingLines }
}
