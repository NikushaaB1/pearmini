import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Shield, Sparkles, Trash2, Users, Lightbulb, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import ModelAvatar from '../components/ui/ModelAvatar'
import EmojiPicker from '../components/ui/EmojiPicker'
import { useUserStore } from '../store/useUserStore'
import { buildAvatarLookup, getProfileAvatar, resolveSenderAvatar } from '../services/avatarService'
import {
  deleteAllMessages,
  deleteMessage,
  sendMessage,
  sortMessagesChronologically,
  subscribeToMessages,
} from '../services/chatService'
import { createIdea, toggleLikeIdea, deleteIdea } from '../services/ideasService'
import { isAdminBadgeRole, isAdminRole } from '../utils/roles'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'დღეს'
  if (d.toDateString() === yesterday.toDateString()) return 'გუშინ'
  return d.toLocaleDateString('ka-GE', { weekday: 'long', month: 'long', day: 'numeric' })
}

function AdminBadge({ subtle = false, head = false }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide shrink-0"
      style={
        subtle
          ? { background: 'rgba(255,255,255,0.22)', color: '#fff' }
          : { background: 'var(--accent-soft)', color: 'var(--accent)' }
      }
    >
      <Shield size={9} />
      {head ? 'უფროსი ადმინი' : 'ადმინი'}
    </span>
  )
}

export default function Chat() {
  const { user, role, modelId, models, userAvatar, userProfiles } = useUserStore()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [ready, setReady] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [clearing, setClearing] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  const ideas = useUserStore((s) => s.ideas)
  const [ideaText, setIdeaText] = useState('')
  const [submittingIdea, setSubmittingIdea] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')

  const myAvatar = useMemo(
    () => getProfileAvatar({ role, modelId, models, userAvatar }),
    [role, modelId, models, userAvatar]
  )

  const avatarLookup = useMemo(
    () => buildAvatarLookup(models, userProfiles),
    [models, userProfiles]
  )

  const sortedMessages = useMemo(
    () => sortMessagesChronologically(messages),
    [messages]
  )

  useEffect(() => {
    return subscribeToMessages((msgs) => {
      setMessages(msgs)
      setReady(true)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sortedMessages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending || !user) return

    setSending(true)
    try {
      await sendMessage({
        text,
        senderUid: user.uid,
        senderName: user.displayName || user.email,
        senderRole: role,
        senderAvatar: myAvatar,
        senderModelId: role === 'model' ? modelId : null,
        senderEmail: user.email || null,
      })
      setText('')
      textareaRef.current?.focus()
    } catch (err) {
      toast.error(err.message || 'შეტყობინების გაგზავნა ვერ მოხერხდა')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const handleDeleteMessage = async (msg) => {
    if (!user || msg.senderUid !== user.uid) return
    if (!window.confirm('წავშალოთ ეს შეტყობინება?')) return

    setDeletingId(msg.id)
    try {
      await deleteMessage(msg.id, user.uid)
      toast.success('შეტყობინება წაიშალა')
    } catch (err) {
      toast.error(err.message || 'წაშლა ვერ მოხერხდა')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSendIdea = async (e) => {
    e.preventDefault()
    if (!ideaText.trim() || submittingIdea || !user) return

    setSubmittingIdea(true)
    try {
      await createIdea(ideaText, user.uid, user.displayName || user.email, myAvatar)
      setIdeaText('')
      toast.success('იდეა წარმატებით დაემატა!')
    } catch (err) {
      console.error('Idea submission error:', err)
      toast.error('იდეის დამატება ვერ მოხერხდა: ' + (err?.message || 'უცნობი შეცდომა'))
    } finally {
      setSubmittingIdea(false)
    }
  }

  const handleLikeIdea = async (ideaId) => {
    if (!user) return
    try {
      await toggleLikeIdea(ideaId, user.uid)
    } catch {
      toast.error('მოქმედება ვერ მოხერხდა')
    }
  }

  const handleDeleteIdea = async (ideaId) => {
    if (!user) return
    if (!window.confirm('დარწმუნებული ხართ, რომ გსურთ ამ იდეის წაშლა?')) return
    try {
      await deleteIdea(ideaId, user.uid)
      toast.success('იდეა წაიშალა')
    } catch (err) {
      toast.error(err.message || 'წაშლა ვერ მოხერხდა')
    }
  }

  const handleClearChat = async () => {
    if (!isAdminRole(role)) return
    if (!window.confirm('წავშალოთ მთელი ჩათი? ეს მოქმედება შეუქცევადია.')) return

    setClearing(true)
    try {
      await deleteAllMessages()
      toast.success('ჩათი გასუფთავდა')
    } catch {
      toast.error('ჩათის გასუფთავება ვერ მოხერხდა')
    } finally {
      setClearing(false)
    }
  }

  let lastDate = null
  const participantCount = new Set(sortedMessages.map((m) => m.senderUid)).size

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[var(--accent)] text-xs uppercase tracking-[0.2em] mb-2">
                <Sparkles size={12} />
                PEAR™ Elite
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
                <MessageCircle size={30} strokeWidth={1.5} />
                ჩატი
              </h1>
              <p className="text-[var(--text-muted)] mt-1.5">ელეგანტური საერთო სივრცე ყველასთვის</p>
            </div>
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
            >
              <Users size={16} className="text-[var(--accent)]" />
              <span className="text-[var(--text-muted)]">
                {sortedMessages.length > 0 ? `${participantCount} მონაწილე` : 'დაიწყე საუბარი'}
              </span>
            </div>
          </div>
        </FadeInItem>

        <FadeInItem>
          {/* Mobile Tab Toggle */}
          <div className="lg:hidden flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all border ${
                activeTab === 'chat'
                  ? 'nav-link-active border-[var(--accent-soft)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent bg-[var(--bg-hover)]'
              }`}
            >
              ჩატი
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all border ${
                activeTab === 'ideas'
                  ? 'nav-link-active border-[var(--accent-soft)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border-transparent bg-[var(--bg-hover)]'
              }`}
            >
              იდეები ({ideas.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Left Column: Chat Messages */}
            <div
              className={`lg:col-span-6 rounded-3xl overflow-hidden flex flex-col shadow-2xl border ${
                activeTab === 'chat' ? 'flex' : 'hidden lg:flex'
              }`}
              style={{
                height: 'calc(100vh - 12rem)',
                minHeight: '480px',
                maxHeight: '720px',
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-card)',
                boxShadow: '0 24px 80px -24px rgba(0,0,0,0.18)',
              }}
            >
              {/* Header */}
              <div
                className="px-5 py-4 flex items-center justify-between border-b backdrop-blur-md"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: 'linear-gradient(135deg, var(--accent-soft) 0%, transparent 60%)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text-primary)]">საერთო ჩათი</p>
                    <p className="text-[11px] text-[var(--text-muted)]">ყველა მომხმარებელი ერთ სივრცეში</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">აქტიური</span>
                  {isAdminRole(role) && sortedMessages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearChat}
                      disabled={clearing}
                      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-colors hover:bg-red-500/10 text-red-500 disabled:opacity-50"
                      title="მთელი ჩათის წაშლა"
                    >
                      <Trash2 size={13} />
                      {clearing ? 'იშლება...' : 'ჩათის გასუფთავება'}
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-1"
                style={{
                  background:
                    'radial-gradient(ellipse at top, var(--accent-soft) 0%, transparent 55%), var(--bg-hover)',
                }}
              >
                {!ready ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                    <p className="text-sm text-[var(--text-muted)]">იტვირთება...</p>
                  </div>
                ) : sortedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div
                      className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
                      style={{ background: 'var(--accent-soft)' }}
                    >
                      <MessageCircle size={28} className="text-[var(--accent)]" />
                    </div>
                    <p className="font-medium text-[var(--text-primary)]">ჯერ ცარიელია</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">
                      მოესალმე გუნდს — პირველი შეტყობინება შენ გაქვს!
                    </p>
                  </div>
                ) : (
                  (() => {
                    let lastDate = null
                    return sortedMessages.map((msg) => {
                      const isOwn = msg.senderUid === user?.uid
                      const msgDate = formatDate(msg.createdAt)
                      const showDate = msgDate !== lastDate
                      if (showDate) lastDate = msgDate
                      const avatar = resolveSenderAvatar(msg, avatarLookup)

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-5">
                              <span
                                className="text-[10px] px-4 py-1 rounded-full font-medium tracking-wide"
                                style={{
                                  background: 'var(--bg-card)',
                                  color: 'var(--text-muted)',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                {msgDate}
                              </span>
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-2.5 mb-4 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <div className="w-8 shrink-0 self-end mb-1">
                              <ModelAvatar
                                src={avatar}
                                name={msg.senderName}
                                size="xs"
                                className="!rounded-xl !w-8 !h-8 !text-xs"
                              />
                            </div>

                            <div className={`max-w-[78%] sm:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                              <div
                                className={`flex items-center gap-1.5 mb-1.5 px-0.5 flex-wrap ${
                                  isOwn ? 'flex-row-reverse' : 'flex-row'
                                }`}
                              >
                                <span className="text-xs font-semibold text-[var(--text-primary)]">
                                  {isOwn ? `შენ · ${msg.senderName}` : msg.senderName}
                                </span>
                                {isAdminBadgeRole(msg.senderRole) && (
                                  <AdminBadge head={msg.senderRole === 'head_admin'} />
                                )}
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  {formatTime(msg.createdAt)}
                                </span>
                              </div>

                              <div className={`group relative ${isOwn ? 'flex flex-row-reverse items-start gap-1' : ''}`}>
                                <div
                                  className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl"
                                  style={
                                    isOwn
                                      ? {
                                          background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, #000) 100%)',
                                          color: '#fff',
                                          boxShadow: '0 4px 20px -4px color-mix(in srgb, var(--accent) 50%, transparent)',
                                        }
                                      : {
                                          background: 'var(--bg-card)',
                                          color: 'var(--text-primary)',
                                          border: '1px solid var(--border-subtle)',
                                          boxShadow: '0 2px 12px -4px rgba(0,0,0,0.08)',
                                        }
                                  }
                                >
                                  {msg.text}
                                </div>
                                {isOwn && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMessage(msg)}
                                    disabled={deletingId === msg.id}
                                    className="shrink-0 p-1.5 rounded-lg opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 disabled:opacity-40"
                                    title="შეტყობინების წაშლა"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )
                    })
                  })()
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="px-4 sm:px-5 py-4 border-t"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div
                  className="flex items-end gap-2 p-2 rounded-2xl"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}
                >
                  <ModelAvatar src={myAvatar} name={user?.displayName} size="sm" className="!rounded-xl ml-1 mb-1 hidden sm:flex" />
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="დაწერე შეტყობინება..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent px-2 py-2.5 text-sm focus:outline-none min-h-[44px] max-h-28"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <EmojiPicker onEmojiSelect={(emoji) => setText(text + emoji)} />
                  <AnimatePresence mode="wait">
                    <motion.button
                      key={text.trim() ? 'active' : 'idle'}
                      type="submit"
                      disabled={!text.trim() || sending}
                      initial={{ scale: 0.85, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: text.trim() ? 1 : 0.45 }}
                      whileTap={{ scale: 0.92 }}
                      className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center mb-0.5 mr-0.5 transition-all disabled:cursor-not-allowed"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      <Send size={17} />
                    </motion.button>
                  </AnimatePresence>
                </div>
                <p className="text-[10px] text-[var(--text-subtle)] mt-2 text-center">
                  Enter — გაგზავნა · Shift+Enter — ახალი ხაზი
                </p>
              </form>
            </div>

            {/* Right Column: Ideas Board */}
            <div
              className={`lg:col-span-4 rounded-3xl overflow-hidden flex flex-col shadow-2xl border ${
                activeTab === 'ideas' ? 'flex' : 'hidden lg:flex'
              }`}
              style={{
                height: 'calc(100vh - 12rem)',
                minHeight: '480px',
                maxHeight: '720px',
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-card)',
                boxShadow: '0 24px 80px -24px rgba(0,0,0,0.18)',
              }}
            >
              {/* Ideas Header */}
              <div
                className="px-5 py-4 flex items-center justify-between border-b backdrop-blur-md"
                style={{
                  borderColor: 'var(--border-subtle)',
                  background: 'linear-gradient(135deg, var(--accent-soft) 0%, transparent 60%)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    <Lightbulb size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text-primary)]">იდეების დაფა</p>
                    <p className="text-[11px] text-[var(--text-muted)]">გააზიარე შენი კრეატიული აზრი</p>
                  </div>
                </div>
              </div>

              {/* Ideas List */}
              <div
                className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                style={{
                  background: 'var(--bg-hover)',
                }}
              >
                {ideas.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 text-[var(--accent)]"
                      style={{ background: 'var(--accent-soft)' }}
                    >
                      <Lightbulb size={22} />
                    </div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">ჯერ არ არის იდეები</p>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 max-w-xs">
                      გახდი პირველი! დაწერე შენი კრეატიული იდეა ბრენდისთვის ქვემოთ.
                    </p>
                  </div>
                ) : (
                  ideas.map((idea) => {
                    const hasLiked = Array.isArray(idea.likes) && idea.likes.includes(user?.uid)
                    const isOwner = idea.senderUid === user?.uid
                    const isAdmin = isAdminRole(role)

                    return (
                      <motion.div
                        key={idea.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 rounded-2xl border shadow-sm flex flex-col gap-2.5 transition-all"
                        style={{
                          background: 'var(--bg-card-solid)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <ModelAvatar
                              src={idea.senderAvatar}
                              name={idea.senderName}
                              size="xs"
                              className="!rounded-lg !w-7 !h-7 !text-[10px]"
                            />
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-primary)]">
                                {idea.senderName}
                              </p>
                              <p className="text-[9px] text-[var(--text-subtle)]">
                                {new Date(idea.createdAt).toLocaleDateString('ka-GE', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          {(isOwner || isAdmin) && (
                            <button
                              onClick={() => handleDeleteIdea(idea.id)}
                              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-hover)] transition-colors"
                              title="იდეის წაშლა"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                          {idea.text}
                        </p>

                        <div className="flex justify-end border-t pt-2" style={{ borderColor: 'var(--border-subtle)' }}>
                          <button
                            onClick={() => handleLikeIdea(idea.id)}
                            className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                              hasLiked
                                ? 'bg-[var(--accent-soft)] text-[var(--accent)] scale-105 shadow-sm'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                            }`}
                          >
                            <Heart size={12} fill={hasLiked ? 'var(--accent)' : 'none'} className="transition-transform duration-200" />
                            <span>{Array.isArray(idea.likes) ? idea.likes.length : 0} მოწონება</span>
                          </button>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Ideas Input */}
              <form
                onSubmit={handleSendIdea}
                className="px-4 py-3.5 border-t"
                style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}
              >
                <div
                  className="flex items-center gap-2 p-2 rounded-2xl"
                  style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)' }}
                >
                  <textarea
                    value={ideaText}
                    onChange={(e) => setIdeaText(e.target.value)}
                    placeholder="გაგვიზიარე ახალი იდეა..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent px-2 py-2 text-xs focus:outline-none min-h-[36px] max-h-20"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <EmojiPicker onEmojiSelect={(emoji) => setIdeaText(ideaText + emoji)} />
                  <motion.button
                    type="submit"
                    disabled={!ideaText.trim() || submittingIdea}
                    whileTap={{ scale: 0.95 }}
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--accent)] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={14} />
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </FadeInItem>
      </FadeInContainer>
    </PageTransition>
  )
}
