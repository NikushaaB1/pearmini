import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type PostAction = 'draft' | 'improve' | 'shorten' | 'suggest_comment'
type Mode = 'chat' | 'post' | 'image'

const DEPRECATED_MODELS = new Set([
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.5-flash-image-preview',
])

const TEXT_MODEL_DEFAULT = 'gemini-2.5-flash'
const IMAGE_MODEL_DEFAULT = 'gemini-2.5-flash-image'

const TEXT_MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro']
const IMAGE_MODEL_FALLBACKS = [
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image-preview',
  'gemini-3-pro-image-preview',
]

const MAX_IMAGE_BASE64_LEN = 6_500_000

const TEXT_MODEL = Deno.env.get('GEMINI_TEXT_MODEL') || TEXT_MODEL_DEFAULT
const IMAGE_MODEL = Deno.env.get('GEMINI_IMAGE_MODEL') || IMAGE_MODEL_DEFAULT

type ApiPart = { text?: string; inlineData?: { mimeType: string; data: string } }

function buildModelChain(preferred: string | undefined, defaultModel: string, fallbacks: string[]): string[] {
  const head = preferred?.trim() || defaultModel
  const chain = [head, defaultModel, ...fallbacks].filter(
    (m, i, arr) => !DEPRECATED_MODELS.has(m) && arr.indexOf(m) === i
  )
  return chain.length ? chain : [defaultModel]
}

function buildImageModelChain(): string[] {
  return buildModelChain(IMAGE_MODEL, IMAGE_MODEL_DEFAULT, IMAGE_MODEL_FALLBACKS).filter((m) =>
    m.includes('-image')
  )
}

function normalizeBase64(raw: string): string {
  const trimmed = raw.trim()
  const comma = trimmed.indexOf(',')
  return comma >= 0 ? trimmed.slice(comma + 1) : trimmed
}

function parseGeminiError(raw: string): string {
  try {
    const parsed = JSON.parse(raw)
    const message = parsed?.error?.message || parsed?.message
    if (message) return String(message)
  } catch {
    // not JSON
  }
  return raw.slice(0, 280) || 'Gemini API ვერ უპასუხა'
}

function parseGeminiResponse(data: unknown): { text: string; image?: { data: string; mimeType: string } } {
  const parts = (data as { candidates?: { content?: { parts?: Record<string, unknown>[] } }[] })?.candidates?.[0]
    ?.content?.parts

  if (!parts?.length) {
    throw new Error('AI-მ ცარიელი პასუხი დააბრუნა')
  }

  let text = ''
  let image: { data: string; mimeType: string } | undefined

  for (const part of parts) {
    if (typeof part.text === 'string') text += part.text

    const inline =
      (part.inlineData as { data?: string; mimeType?: string } | undefined) ||
      (part.inline_data as { data?: string; mime_type?: string } | undefined)

    if (inline?.data) {
      image = {
        data: inline.data,
        mimeType: inline.mimeType || inline.mime_type || 'image/png',
      }
    }
  }

  return { text: text.trim(), image }
}

async function callGeminiText(apiKey: string, models: string[], text: string) {
  const chain = models.filter((m, i, arr) => !DEPRECATED_MODELS.has(m) && arr.indexOf(m) === i)
  let lastError = 'Gemini API ვერ უპასუხა'

  for (const currentModel of chain) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text }] }],
      }),
    })

    const raw = await res.text()
    if (res.ok) return JSON.parse(raw)

    console.error(`Gemini error (${currentModel}):`, raw)
    lastError = parseGeminiError(raw)
  }

  throw new Error(lastError)
}

async function callGeminiChat(
  apiKey: string,
  models: string[],
  contents: { role: string; parts: ApiPart[] }[]
) {
  const chain = models.filter((m, i, arr) => !DEPRECATED_MODELS.has(m) && arr.indexOf(m) === i)
  let lastError = 'Gemini API ვერ უპასუხა'

  for (const currentModel of chain) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents }),
    })

    const raw = await res.text()
    if (res.ok) return JSON.parse(raw)

    console.error(`Gemini chat error (${currentModel}):`, raw)
    lastError = parseGeminiError(raw)
  }

  throw new Error(lastError)
}

async function callGeminiImageEdit(
  apiKey: string,
  models: string[],
  mimeType: string,
  imageBase64: string,
  userPrompt: string
) {
  const cleanBase64 = normalizeBase64(imageBase64)

  if (!cleanBase64) {
    throw new Error('ფოტოს მონაცემები ცარიელია')
  }

  if (cleanBase64.length > MAX_IMAGE_BASE64_LEN) {
    throw new Error('ფოტო ძალიან დიდია. სცადე უფრო პატარა სურათი (max ~4MB).')
  }

  const editInstruction =
    'You are a professional photo editor for PEAR Elite. Edit the provided image according to the user request. ' +
    'Preserve important text, logos, and composition unless asked to change them. ' +
    'Output the edited image. Also reply in Georgian in 1-2 short sentences about what you changed.'

  const parts: ApiPart[] = [
    { inlineData: { mimeType, data: cleanBase64 } },
    { text: `${editInstruction}\n\nUser request:\n${userPrompt}` },
  ]

  const chain = models.filter((m, i, arr) => m.includes('-image') && !DEPRECATED_MODELS.has(m) && arr.indexOf(m) === i)
  let lastError = 'სურათის რედაქტირების მოდელი ვერ უპასუხა'

  for (const currentModel of chain) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    })

    const raw = await res.text()
    if (!res.ok) {
      console.error(`Gemini image error (${currentModel}):`, raw)
      lastError = parseGeminiError(raw)
      continue
    }

    const data = JSON.parse(raw)
    const parsed = parseGeminiResponse(data)

    if (parsed.image?.data) {
      return parsed
    }

    console.warn(`Gemini image model ${currentModel} returned no image`, raw.slice(0, 500))
    lastError = 'AI-მ სურათი ვერ დააბრუნა — სცადე უფრო მოკლე აღწერა'
  }

  throw new Error(lastError)
}

function postSystemPrompt(action: PostAction): string {
  const base =
    'You are a helpful assistant for PEAR Elite, a premium Georgian model network. Write naturally in Georgian (ქართული). Keep tone warm, professional, and social-media friendly. No hashtags unless asked. No markdown. Return only the final text, nothing else.'

  switch (action) {
    case 'draft':
      return `${base} Turn the user's idea or keywords into a short social post (1-4 sentences).`
    case 'improve':
      return `${base} Improve grammar, flow, and clarity while keeping the author's meaning and voice.`
    case 'shorten':
      return `${base} Make the post shorter and punchier while keeping the main message.`
    case 'suggest_comment':
      return `${base} Write one friendly, relevant comment (1-2 sentences) for the given post.`
    default:
      return base
  }
}

function postUserPrompt(action: PostAction, text: string, authorName?: string): string {
  const name = authorName?.trim() || 'მომხმარებელი'
  switch (action) {
    case 'draft':
      return `ავტორი: ${name}\nიდეა ან საკვანძო სიტყვები:\n${text}`
    case 'suggest_comment':
      return `პოსტი:\n${text}\n\nშემომთავაზე კომენტარი ავტორისთვის ${name}.`
    default:
      return `ავტორი: ${name}\nტექსტი:\n${text}`
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const geminiKey = Deno.env.get('GEMINI_API_KEY')

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!geminiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY არ არის დაყენებული. Supabase → Edge Functions → Secrets.',
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const mode = String(body.mode || 'chat') as Mode

    if (mode === 'post') {
      const action = String(body.action || 'improve') as PostAction
      const text = String(body.text || '').trim()
      const authorName = String(body.authorName || '').trim()

      const allowed: PostAction[] = ['draft', 'improve', 'shorten', 'suggest_comment']
      if (!allowed.includes(action)) {
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!text) {
        return new Response(JSON.stringify({ error: 'ტექსტი საჭიროა' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (text.length > 4000) {
        return new Response(JSON.stringify({ error: 'ტექსტი ძალიან გრძელია' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const data = await callGeminiText(
        geminiKey,
        buildModelChain(TEXT_MODEL, TEXT_MODEL_DEFAULT, TEXT_MODEL_FALLBACKS),
        `${postSystemPrompt(action)}\n\n${postUserPrompt(action, text, authorName)}`
      )
      const { text: result } = parseGeminiResponse(data)

      if (!result) {
        return new Response(JSON.stringify({ error: 'ცარიელი პასუხი AI-დან' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ text: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (mode === 'image') {
      const prompt = String(body.prompt || '').trim()
      const imageBase64 = String(body.imageBase64 || '').trim()
      const mimeType = String(body.mimeType || 'image/jpeg').trim()

      if (!prompt) {
        return new Response(JSON.stringify({ error: 'აღწერე რა გინდა ფოტოზე' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!imageBase64) {
        return new Response(JSON.stringify({ error: 'ატვირთე ფოტო' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const parsed = await callGeminiImageEdit(
        geminiKey,
        buildImageModelChain(),
        mimeType,
        imageBase64,
        prompt
      )

      return new Response(
        JSON.stringify({
          text: parsed.text || 'ფოტო განახლდა.',
          image: parsed.image,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // chat mode (default)
    const prompt = String(body.prompt || body.text || '').trim()
    const imageBase64 = String(body.imageBase64 || '').trim()
    const mimeType = String(body.mimeType || 'image/jpeg').trim()
    const history = Array.isArray(body.history) ? body.history : []

    if (!prompt && !imageBase64) {
      return new Response(JSON.stringify({ error: 'დაწერე შეტყობინება ან ატვირთე ფოტო' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const system =
      'You are PEAR Elite AI — a friendly, capable assistant for Georgian models and admins. ' +
      'Reply in Georgian unless asked otherwise. Help with text writing, ideas, captions, photo advice, ' +
      'social media, and general questions. Be concise and practical.'

    const contents: { role: string; parts: ApiPart[] }[] = []

    for (const msg of history.slice(-12)) {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user'
      const content = String(msg.content || msg.text || '').trim()
      if (!content) continue
      contents.push({ role, parts: [{ text: content }] })
    }

    const userParts: ApiPart[] = [{ text: `${system}\n\n${prompt || 'გააანალიზე ეს ფოტო და მომცე რჩევები.'}` }]
    if (imageBase64) {
      userParts.unshift({
        inlineData: { mimeType, data: normalizeBase64(imageBase64) },
      })
    }

    contents.push({ role: 'user', parts: userParts })

    const data = await callGeminiChat(
      geminiKey,
      buildModelChain(TEXT_MODEL, TEXT_MODEL_DEFAULT, TEXT_MODEL_FALLBACKS),
      contents
    )
    const { text: result } = parseGeminiResponse(data)

    if (!result) {
      return new Response(JSON.stringify({ error: 'ცარიელი პასუხი AI-დან' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ text: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error(err)
    const message = err instanceof Error ? err.message : 'Internal error'
    const status = message.includes('GEMINI_API_KEY') ? 503 : 502
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
