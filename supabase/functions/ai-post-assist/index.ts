import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action = 'draft' | 'improve' | 'shorten' | 'suggest_comment'

function systemPrompt(action: Action): string {
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

function userPrompt(action: Action, text: string, authorName?: string): string {
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
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!openaiKey) {
      return new Response(
        JSON.stringify({
          error: 'OPENAI_API_KEY არ არის დაყენებული. Supabase → Edge Functions → Secrets.',
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
    const action = String(body.action || 'improve') as Action
    const text = String(body.text || '').trim()
    const authorName = String(body.authorName || '').trim()

    const allowed: Action[] = ['draft', 'improve', 'shorten', 'suggest_comment']
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

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt(action) },
          { role: 'user', content: userPrompt(action, text, authorName) },
        ],
        max_tokens: 400,
        temperature: 0.65,
      }),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text()
      console.error('OpenAI error:', errText)
      return new Response(JSON.stringify({ error: 'AI სერვისი ვერ უპასუხა' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiData = await aiRes.json()
    const result = String(aiData?.choices?.[0]?.message?.content || '').trim()

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
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
