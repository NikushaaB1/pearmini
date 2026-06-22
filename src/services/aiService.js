import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { applyLocalImageEdit, isInstructionLikeText } from './localImageEdit'

function ensureConfigured() {
  if (!isConfigured || !supabase) {
    throw new Error('AI მხოლოდ Supabase-თან მუშაობს. დააყენე VITE_SUPABASE_URL და გაუშვი Edge Function.')
  }
}

function isEdgeUnreachable(error) {
  const msg = String(error?.message || '')
  return /Failed to send a request to the Edge Function|FunctionsFetchError|NetworkError|fetch failed/i.test(msg)
}

async function readFunctionError(error) {
  if (isEdgeUnreachable(error)) {
    return 'Edge Function დროებით მიუწვდომელია. სცადე თავიდან ან განაახლე გვერდი.'
  }
  if (error instanceof FunctionsHttpError && error.context) {
    try {
      const payload = await error.context.json()
      if (payload?.error) return String(payload.error)
    } catch {
      // ignore parse errors
    }
  }
  return error?.message || 'AI მოთხოვნა ვერ შესრულდა'
}

async function invokeGemini(body) {
  ensureConfigured()

  const { data, error } = await supabase.functions.invoke('gemini-assist', { body })

  if (error) {
    throw new Error(await readFunctionError(error))
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data
}

/**
 * @param {{ action: 'draft'|'improve'|'shorten'|'suggest_comment', text: string, authorName?: string }} params
 */
export async function assistWithAi({ action, text, authorName }) {
  const trimmed = text?.trim()
  if (!trimmed) throw new Error('დაწერე ტექსტი ან იდეა')

  const data = await invokeGemini({
    mode: 'post',
    action,
    text: trimmed,
    authorName,
  })

  const result = data?.text?.trim()
  if (!result) throw new Error('AI-მ ცარიელი პასუხი დააბრუნა')

  return result
}

/**
 * @param {{ prompt: string, history?: { role: string, content: string }[], imageBase64?: string, mimeType?: string }} params
 */
export async function chatWithAi({ prompt, history = [], imageBase64, mimeType }) {
  const trimmed = prompt?.trim()
  if (!trimmed && !imageBase64) throw new Error('დაწერე შეტყობინება')

  const data = await invokeGemini({
    mode: 'chat',
    prompt: trimmed,
    history,
    imageBase64,
    mimeType,
  })

  const result = data?.text?.trim()
  if (!result) throw new Error('AI-მ ცარიელი პასუხი დააბრუნა')

  return { text: result }
}

/**
 * @param {{ prompt: string, imageBase64: string, mimeType?: string }} params
 */
export async function editImageWithAi({ prompt, imageBase64, mimeType = 'image/jpeg' }) {
  if (!imageBase64) throw new Error('ატვირთე ფოტო')
  if (!prompt?.trim()) throw new Error('აღწერე რა გინდა ფოტოზე')

  const trimmedPrompt = prompt.trim()

  try {
    const data = await invokeGemini({
      mode: 'image',
      prompt: trimmedPrompt,
      imageBase64,
      mimeType,
    })

    if (data?.image?.data) {
      return {
        text: data?.text?.trim() || 'ფოტო განახლდა.',
        image: data.image,
        note: null,
      }
    }

    if (data?.note || (data?.text && isInstructionLikeText(data.text))) {
      throw new Error('cloud_image_unavailable')
    }
  } catch (err) {
    console.warn('Gemini image edit failed:', err?.message || err)
  }

  const local = await applyLocalImageEdit({
    imageBase64,
    mimeType,
    prompt: trimmedPrompt,
  })

  const parts = []
  if (wantsLocalFeatures(trimmedPrompt)) {
    if (/pear|ლოგო|logo/i.test(trimmedPrompt)) parts.push('PEAR ლოგო დაემატა')
    if (/warm|gold|ოქრ|განათ|illumination|გააუმჯობეს|enhance/i.test(trimmedPrompt)) {
      parts.push('ოქროსფერი გან illumination გაძლიერდა')
    }
  }

  return {
    text: parts.length
      ? `${parts.join(', ')}. (PEAR ლოკალური რედაქტორი — cloud AI დროებით მიუწვდომელია)`
      : 'ფოტო განახლდა (PEAR ლოკალური რედაქტორი).',
    image: local,
    note: null,
  }
}

function wantsLocalFeatures(prompt) {
  return /pear|ლოგო|logo|warm|gold|ოქრ|განათ|illumination|გააუმჯობეს|enhance/i.test(prompt || '')
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('ფაილის წაკითხვა ვერ მოხერხდა'))
    reader.readAsDataURL(file)
  })
}

/** Resize/compress image before sending to Gemini (max side ~1536px). */
export function prepareImageForAi(file, maxSide = 1536) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('მხოლოდ სურათი'))
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > maxSide || height > maxSide) {
        if (width >= height) {
          height = Math.round((height * maxSide) / width)
          width = maxSide
        } else {
          width = Math.round((width * maxSide) / height)
          height = maxSide
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas ვერ შეიქმნა'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = mimeType === 'image/jpeg' ? 0.88 : undefined
      const dataUrl = canvas.toDataURL(mimeType, quality)
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
      resolve({ base64, mimeType })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('ფოტოს დამუშავება ვერ მოხერხდა'))
    }

    img.src = url
  })
}

export const AI_POST_ACTIONS = [
  { id: 'draft', label: 'პოსტის შექმნა', hint: 'იდეიდან' },
  { id: 'improve', label: 'გაუმჯობესება', hint: 'ტექსტის' },
  { id: 'shorten', label: 'მოკლედ', hint: 'შეჯამება' },
]

export const AI_QUICK_ACTIONS = [
  {
    id: 'enhance',
    label: 'ფოტოს გასწორება',
    prompt: 'გააუმჯობესე ეს ფოტო: გაასწორე გან illumination, კონტრასტი, ფერები და რბილი retouch. შეინარჩუნე ბუნებრივი იერი.',
    needsImage: true,
    mode: 'image',
  },
  {
    id: 'add',
    label: 'ფოტოზე დამატება',
    prompt: '',
    needsImage: true,
    mode: 'image',
    askPrompt: 'რა გინდა დაემატოს ფოტოზე?',
  },
  {
    id: 'caption',
    label: 'ტექსტის შექმნა',
    prompt: 'შემიქმენი მოკლე, მიმზიდველი ტექსტი / caption სოციალური პოსტისთვის PEAR Elite-ისთვის.',
    needsImage: false,
    mode: 'chat',
  },
  {
    id: 'ideas',
    label: 'იდეები',
    prompt: 'მომცე 5 კრეატიული იდეა კონტენტისთვის PEAR Elite მოდელებისთვის.',
    needsImage: false,
    mode: 'chat',
  },
]
