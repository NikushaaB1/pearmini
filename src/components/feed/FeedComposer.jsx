import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ImagePlus, X, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import ModelAvatar from '../ui/ModelAvatar'
import Button from '../ui/Button'
import { createFeedPost } from '../../services/feedPostsService'
import { uploadImage } from '../../services/storage'
import { useUserStore } from '../../store/useUserStore'
import { assistWithAi, AI_POST_ACTIONS } from '../../services/aiService'

export default function FeedComposer({
  user,
  modelId,
  avatar,
  authorName,
  prominentAi = false,
  defaultAiOpen = false,
  hideAi = false,
}) {
  const prependFeedPost = useUserStore((s) => s.prependFeedPost)
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [posting, setPosting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiOpen, setAiOpen] = useState(defaultAiOpen)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) return toast.error('მხოლოდ სურათი')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const clearFile = () => {
    setFile(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const scrollToFeed = () => {
    requestAnimationFrame(() => {
      document.getElementById('team-feed-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleAi = async (action) => {
    const seed = text.trim() || (action === 'draft' ? 'PEAR Elite გუნდის განახლება' : '')
    if (!seed) {
      toast.error(action === 'draft' ? 'დაწერე იდეა ან საკვანძო სიტყვები' : 'ჯერ დაწერე ტექსტი')
      return
    }

    setAiLoading(true)
    setAiOpen(false)
    try {
      const result = await assistWithAi({ action, text: seed, authorName })
      setText(result)
      toast.success('AI-მ ტექსტი მომზადა')
    } catch (err) {
      toast.error(err.message || 'AI ვერ მუშაობს')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!user?.uid) return toast.error('შესვლა საჭიროა')
    if (!text.trim() && !file) return toast.error('დაწერე რამე ან ატვირთე ფოტო')

    setPosting(true)
    try {
      let imageUrl = null
      if (file) {
        const uploaded = await uploadImage(file, modelId || user.uid, 'feed_posts')
        imageUrl = uploaded.url
      }

      const newPost = await createFeedPost({
        authorUid: user.uid,
        authorName,
        authorAvatar: avatar,
        modelId,
        content: text,
        imageUrl,
      })

      prependFeedPost(newPost)
      setText('')
      clearFile()
      toast.success('პოსტი გამოქვეყნდა')
      scrollToFeed()
    } catch (err) {
      toast.error(err.message || 'პოსტი ვერ გამოქვეყნდა')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className={`feed-composer ${prominentAi && !hideAi ? 'feed-composer--ai-prominent' : ''}`}>
      <div className="feed-composer-head">
        <ModelAvatar src={avatar} name={authorName} size="sm" roundedFull className="shrink-0" />
        <div className="feed-composer-head-text min-w-0">
          <p className="feed-composer-head-title">ახალი განახლება</p>
          <p className="feed-composer-head-sub">{authorName}</p>
        </div>
      </div>

      {prominentAi && !hideAi && (
        <div className="feed-ai-strip">
          <div className="feed-ai-strip-head">
            <span className="feed-ai-strip-icon">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0">
              <p className="feed-ai-strip-title">PEAR AI</p>
              <p className="feed-ai-strip-desc">ტექსტი, caption, იდეები — ყველას ხელმისაწვდომია</p>
            </div>
            <Link to="/ai" className="feed-ai-strip-link">
              სრული AI
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="feed-ai-strip-actions">
            {AI_POST_ACTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="feed-ai-chip feed-ai-chip--strip"
                disabled={aiLoading}
                onClick={() => handleAi(item.id)}
              >
                <Sparkles size={14} />
                <span className="feed-ai-chip-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="feed-composer-top feed-composer-top--solo">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`რა გინდა გაუზიარო, ${authorName?.split(' ')[0] || 'ელიტა'}?`}
          rows={2}
          className="feed-composer-input"
          disabled={aiLoading}
        />
      </div>

      {preview && (
        <div className="feed-composer-preview">
          <img src={preview} alt="" />
          <button type="button" onClick={clearFile} className="feed-composer-preview-remove" aria-label="წაშლა">
            <X size={16} />
          </button>
        </div>
      )}

      {aiOpen && !hideAi && (
        <div className="feed-ai-panel">
          {AI_POST_ACTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="feed-ai-chip"
              disabled={aiLoading}
              onClick={() => handleAi(item.id)}
            >
              <span className="feed-ai-chip-label">{item.label}</span>
              <span className="feed-ai-chip-hint">{item.hint}</span>
            </button>
          ))}
        </div>
      )}

      <div className="feed-composer-divider" />

      <div className="feed-composer-actions">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="feed-composer-action feed-composer-action--photo"
          disabled={aiLoading}
        >
          <ImagePlus size={20} />
          <span>ფოტო</span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {!hideAi && (
          <div className="feed-ai-wrap">
            <button
              type="button"
              className={`feed-composer-action feed-composer-action--ai ${prominentAi ? 'feed-composer-action--ai-prominent' : ''} ${aiOpen ? 'feed-composer-action--ai-open' : ''}`}
              disabled={aiLoading || posting}
              onClick={() => setAiOpen((v) => !v)}
            >
              {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              <span>{prominentAi ? 'PEAR AI' : 'AI'}</span>
            </button>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          loading={posting}
          disabled={posting || aiLoading || (!text.trim() && !file)}
          className="!px-5 !py-2 !text-sm ml-auto"
        >
          გამოქვეყნება
        </Button>
      </div>
    </div>
  )
}
