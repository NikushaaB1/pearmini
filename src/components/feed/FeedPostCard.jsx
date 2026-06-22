import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Share2, ThumbsUp, Sparkles, Loader2, Trash2, MoreHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import ModelAvatar from '../ui/ModelAvatar'
import {
  REACTION_TYPES,
  toggleFeedReaction,
  addFeedComment,
  deleteFeedPost,
  countReactions,
  userReaction,
} from '../../services/feedPostsService'
import { assistWithAi } from '../../services/aiService'
import { useUserStore } from '../../store/useUserStore'
import { isAdminRole } from '../../utils/roles'

function formatPostTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'ახლახან'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} წთ`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} სთ`
    return d.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

function ReactionSummary({ reactions }) {
  const active = REACTION_TYPES.filter((t) => (reactions[t.key]?.length || 0) > 0)
  const total = countReactions(reactions)
  if (!total) return null

  return (
    <div className="feed-post-stats">
      <span className="feed-post-reaction-icons">
        {active.slice(0, 3).map((t) => (
          <span key={t.key} className="feed-post-reaction-bubble">
            {t.emoji}
          </span>
        ))}
      </span>
      <span>{total}</span>
    </div>
  )
}

export default function FeedPostCard({
  post,
  currentUid,
  currentUserName,
  currentUserAvatar,
  onNavigateProfile,
  isNew = false,
}) {
  const role = useUserStore((s) => s.role)
  const clearLastNewPostId = useUserStore((s) => s.clearLastNewPostId)

  const [showReactions, setShowReactions] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [aiCommentLoading, setAiCommentLoading] = useState(false)

  const myReaction = currentUid ? userReaction(post.reactions, currentUid) : null
  const commentCount = post.comments?.length || 0
  const canDelete =
    currentUid && (post.authorUid === currentUid || isAdminRole(role))

  useEffect(() => {
    if (!isNew) return undefined
    const timer = setTimeout(() => clearLastNewPostId(), 2800)
    return () => clearTimeout(timer)
  }, [isNew, clearLastNewPostId])

  const handleReaction = async (key) => {
    if (!currentUid) return toast.error('შესვლა საჭიროა')
    try {
      await toggleFeedReaction(post.id, key, currentUid)
      setShowReactions(false)
    } catch {
      toast.error('რეაქცია ვერ დაემატა')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!currentUid || !commentText.trim()) return
    setSubmitting(true)
    try {
      await addFeedComment({
        postId: post.id,
        authorUid: currentUid,
        authorName: currentUserName || 'მომხმარებელი',
        authorAvatar: currentUserAvatar,
        content: commentText,
      })
      setCommentText('')
      setShowComments(true)
    } catch (err) {
      toast.error(err.message || 'კომენტარი ვერ დაემატა')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAiComment = async () => {
    const source = [post.content, post.imageUrl ? '(ფოტო პოსტი)' : ''].filter(Boolean).join('\n')
    if (!source.trim()) return toast.error('პოსტს ტექსტი არ აქვს')
    setAiCommentLoading(true)
    try {
      const suggestion = await assistWithAi({
        action: 'suggest_comment',
        text: source,
        authorName: currentUserName,
      })
      setCommentText(suggestion)
      setShowComments(true)
      toast.success('AI-მ კომენტარი შემოგთავაზა')
    } catch (err) {
      toast.error(err.message || 'AI ვერ მუშაობს')
    } finally {
      setAiCommentLoading(false)
    }
  }

  const handleDelete = async () => {
    setShowMenu(false)
    if (!canDelete) return
    const ok = window.confirm('ნამდვილად გინდა ამ პოსტის წაშლა?')
    if (!ok) return

    setDeleting(true)
    try {
      await deleteFeedPost(post.id)
      toast.success('პოსტი წაიშალა')
    } catch (err) {
      toast.error(err.message || 'პოსტი ვერ წაიშალა')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.article
      layout
      initial={isNew ? { opacity: 0, y: -28, scale: 0.94 } : false}
      animate={
        deleting
          ? { opacity: 0, scale: 0.92, height: 0, marginBottom: 0 }
          : { opacity: 1, y: 0, scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={`feed-post ${isNew ? 'feed-post--new' : ''} ${deleting ? 'feed-post--deleting' : ''}`}
    >
      {isNew && <span className="feed-post-new-badge" aria-hidden>ახალი</span>}

      <header className="feed-post-header">
        <button
          type="button"
          className="feed-post-author"
          onClick={() => post.modelId && onNavigateProfile?.(post.modelId)}
        >
          <ModelAvatar src={post.authorAvatar} name={post.authorName} size="sm" roundedFull />
          <div className="min-w-0 text-left">
            <p className="feed-post-name">{post.authorName}</p>
            <p className="feed-post-time">{formatPostTime(post.createdAt)}</p>
          </div>
        </button>

        {canDelete && (
          <div className="feed-post-menu-wrap">
            <button
              type="button"
              className="feed-post-menu-btn"
              onClick={() => setShowMenu((v) => !v)}
              aria-label="მეტი"
              disabled={deleting}
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <>
                <button
                  type="button"
                  className="feed-post-menu-backdrop"
                  aria-label="დახურვა"
                  onClick={() => setShowMenu(false)}
                />
                <div className="feed-post-menu">
                  <button type="button" className="feed-post-menu-item feed-post-menu-item--danger" onClick={handleDelete}>
                    <Trash2 size={16} />
                    წაშლა
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {post.content && <p className="feed-post-content">{post.content}</p>}

      {post.imageUrl && (
        <div className="feed-post-image-wrap">
          <img src={post.imageUrl} alt="" className="feed-post-image" loading="lazy" />
        </div>
      )}

      {(countReactions(post.reactions) > 0 || commentCount > 0) && (
        <div className="feed-post-meta">
          <ReactionSummary reactions={post.reactions} />
          {commentCount > 0 && (
            <button type="button" className="feed-post-comment-count" onClick={() => setShowComments(true)}>
              {commentCount} კომენტარი
            </button>
          )}
        </div>
      )}

      <div className="feed-post-divider" />

      <div className="feed-post-toolbar">
        <div className="feed-post-react-wrap">
          <button
            type="button"
            className={`feed-post-btn ${myReaction ? 'feed-post-btn--active' : ''}`}
            onMouseEnter={() => setShowReactions(true)}
            onClick={() => setShowReactions((v) => !v)}
          >
            <ThumbsUp size={18} />
            <span>
              {myReaction
                ? `${REACTION_TYPES.find((r) => r.key === myReaction)?.emoji} მოწონება`
                : 'მოწონება'}
            </span>
          </button>
          {showReactions && (
            <div
              className="feed-reaction-picker"
              onMouseLeave={() => setShowReactions(false)}
            >
              {REACTION_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className="feed-reaction-emoji"
                  onClick={() => handleReaction(t.key)}
                  title={t.key}
                >
                  {t.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="feed-post-btn" onClick={() => setShowComments((v) => !v)}>
          <MessageCircle size={18} />
          <span>კომენტარი</span>
        </button>
        <button type="button" className="feed-post-btn feed-post-btn--share" disabled>
          <Share2 size={18} />
          <span>გაზიარება</span>
        </button>
      </div>

      {showComments && (
        <div className="feed-post-comments">
          {(post.comments || []).map((c) => (
            <div key={c.id} className="feed-comment">
              <ModelAvatar src={c.authorAvatar} name={c.authorName} size="xs" roundedFull className="shrink-0 mt-0.5" />
              <div className="feed-comment-bubble">
                <p className="feed-comment-author">{c.authorName}</p>
                <p className="feed-comment-text">{c.content}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handleComment} className="feed-comment-form">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="კომენტარი..."
              className="feed-comment-input"
              disabled={submitting || aiCommentLoading}
            />
            <button
              type="button"
              onClick={handleAiComment}
              disabled={submitting || aiCommentLoading}
              className="feed-comment-ai"
              title="AI კომენტარი"
            >
              {aiCommentLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
            <button type="submit" disabled={submitting || aiCommentLoading || !commentText.trim()} className="feed-comment-submit">
              {submitting ? '...' : 'გაგზავნა'}
            </button>
          </form>
        </div>
      )}
    </motion.article>
  )
}
