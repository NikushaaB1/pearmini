import { useEffect, useRef, useState } from 'react'
import {
  Sparkles,
  Send,
  ImagePlus,
  X,
  Loader2,
  Download,
  Wand2,
  MessageSquareText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/animations/PageTransition'
import PageHeader from '../components/ui/PageHeader'
import ModelAvatar from '../components/ui/ModelAvatar'
import { useUserStore } from '../store/useUserStore'
import { getProfileAvatar } from '../services/avatarService'
import {
  chatWithAi,
  editImageWithAi,
  prepareImageForAi,
  AI_QUICK_ACTIONS,
} from '../services/aiService'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })
}

export default function AiAssistant() {
  const { user, role, modelId, models, userAvatar } = useUserStore()
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'გამარჯობა! მე PEAR Elite AI ვარ. შემიძლია ტექსტის შექმნა, ფოტოს გასწორება, ფოტოზე რამის დამატება და ნებისმიერი კითხვის პასუხი.',
      createdAt: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [mimeType, setMimeType] = useState('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [imageMode, setImageMode] = useState(false)
  const bottomRef = useRef(null)
  const fileRef = useRef(null)
  const textareaRef = useRef(null)

  const avatar = getProfileAvatar({ role, modelId, models, userAvatar })
  const userName = user?.displayName || user?.email || 'ელიტა'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const clearFile = () => {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setMimeType('image/jpeg')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) return toast.error('მხოლოდ სურათი')
    setFile(f)
    setMimeType(f.type)
    setPreview(URL.createObjectURL(f))
    setImageMode(true)
  }

  const pushMessage = (msg) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString(), ...msg },
    ])
  }

  const send = async ({ prompt, forceImageMode = false } = {}) => {
    const text = (prompt ?? input).trim()
    if (!text && !file) return toast.error('დაწერე რამე ან ატვირთე ფოტო')
    if (loading) return

    let imageBase64 = null
    let uploadMime = mimeType
    if (file) {
      try {
        const prepared = await prepareImageForAi(file)
        imageBase64 = prepared.base64
        uploadMime = prepared.mimeType
      } catch {
        return toast.error('ფოტოს დამუშავება ვერ მოხერხდა')
      }
    }

    const userText =
      text ||
      (file
        ? 'გააძლიერე ოქროსფერი გან illumination და დაამატე PEAR ლოგო ზედა მარცხენა კუთხეში'
        : '')

    pushMessage({
      role: 'user',
      text: userText,
      imageUrl: preview,
    })

    setInput('')
    setLoading(true)

    try {
      if (imageBase64) {
        const result = await editImageWithAi({
          prompt: userText,
          imageBase64,
          mimeType: uploadMime,
        })

        if (!result.image?.data) {
          throw new Error('AI-მ სურათი ვერ დააბრუნა')
        }

        pushMessage({
          role: 'assistant',
          text: result.text || 'ფოტო განახლდა.',
          imageData: `data:${result.image.mimeType};base64,${result.image.data}`,
        })
      } else {
        const history = messages
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.text }))

        const result = await chatWithAi({
          prompt: userText,
          history,
        })

        pushMessage({
          role: 'assistant',
          text: result.text,
        })
      }

      clearFile()
      setImageMode(false)
    } catch (err) {
      toast.error(err.message || 'AI ვერ მუშაობს')
      pushMessage({
        role: 'assistant',
        text: `⚠️ ${err.message || 'შეცდომა მოხდა. სცადე თავიდან.'}`,
      })
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleQuickAction = async (action) => {
    if (action.needsImage && !file) {
      toast.error('ჯერ ატვირთე ფოტო')
      fileRef.current?.click()
      return
    }

    if (action.askPrompt) {
      setImageMode(true)
      setInput('')
      toast(action.askPrompt, { icon: '📷' })
      textareaRef.current?.focus()
      return
    }

    if (action.mode === 'image') {
      setImageMode(true)
      await send({ prompt: action.prompt, forceImageMode: true })
      return
    }

    setImageMode(false)
    await send({ prompt: action.prompt })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <PageTransition>
      <div className="ai-page luxury-ai">
        <PageHeader
          title="PEAR AI"
          subtitle="ტექსტი · ფოტო · იდეები · ყველაფერი ერთ ადგილას"
          icon={Sparkles}
        />

        <div className="ai-quick-actions">
          {AI_QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className="ai-quick-chip"
              disabled={loading}
              onClick={() => handleQuickAction(action)}
            >
              {action.mode === 'image' ? <Wand2 size={16} /> : <MessageSquareText size={16} />}
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        <div className="ai-chat-shell">
          <div className="ai-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-message ${msg.role === 'user' ? 'ai-message--user' : 'ai-message--assistant'}`}
              >
                {msg.role === 'assistant' ? (
                  <span className="ai-avatar ai-avatar--bot">
                    <Sparkles size={18} />
                  </span>
                ) : (
                  <ModelAvatar src={avatar} name={userName} size="sm" roundedFull className="shrink-0" />
                )}

                <div className="ai-bubble">
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="" className="ai-bubble-image ai-bubble-image--input" />
                  )}
                  {msg.imageData && (
                    <div className="ai-result-image-wrap">
                      <img src={msg.imageData} alt="AI result" className="ai-bubble-image" />
                      <a
                        href={msg.imageData}
                        download={`pear-ai-${msg.id}.png`}
                        className="ai-download-btn"
                      >
                        <Download size={14} />
                        ჩამოტვირთვა
                      </a>
                    </div>
                  )}
                  <p className="ai-bubble-text whitespace-pre-wrap">{msg.text}</p>
                  <span className="ai-bubble-time">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-message ai-message--assistant">
                <span className="ai-avatar ai-avatar--bot">
                  <Loader2 size={18} className="animate-spin" />
                </span>
                <div className="ai-bubble ai-bubble--loading">
                  <span>AI ფიქრობს...</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {preview && (
            <div className="ai-compose-preview">
              <img src={preview} alt="" />
              <button type="button" onClick={clearFile} aria-label="წაშლა">
                <X size={16} />
              </button>
              {imageMode && <span className="ai-compose-badge">ფოტო რედაქტირება</span>}
            </div>
          )}

          <div className="ai-compose">
            <button
              type="button"
              className={`ai-compose-btn ${imageMode ? 'ai-compose-btn--active' : ''}`}
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              title="ფოტო"
            >
              <ImagePlus size={20} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                imageMode
                  ? 'აღწერე რა გინდა ფოტოზე (მაგ: გააუმჯობესე გან illumination, დაამატე ოქროსფერი ფილტრი)...'
                  : 'კითხვა, ტექსტის იდეა, caption...'
              }
              rows={1}
              disabled={loading}
              className="ai-compose-input"
            />

            <button
              type="button"
              className={`ai-compose-btn ${imageMode ? 'ai-compose-btn--active' : ''}`}
              onClick={() => setImageMode((v) => !v)}
              disabled={loading}
              title="ფოტო რედაქტირების რეჟიმი"
            >
              <Wand2 size={20} />
            </button>

            <button
              type="button"
              className="ai-send-btn"
              onClick={() => send()}
              disabled={loading || (!input.trim() && !file)}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
