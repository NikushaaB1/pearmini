import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { useUserStore } from '../store/useUserStore'

const POSTS_KEY = 'pear_feed_posts'
const COMMENTS_KEY = 'pear_feed_comments'

export const REACTION_TYPES = [
  { key: 'like', emoji: '👍' },
  { key: 'love', emoji: '❤️' },
  { key: 'haha', emoji: '😂' },
  { key: 'wow', emoji: '😮' },
  { key: 'sad', emoji: '😢' },
  { key: 'angry', emoji: '😡' },
]

function getLocalPosts() {
  const data = localStorage.getItem(POSTS_KEY)
  return data ? JSON.parse(data) : []
}

function getLocalComments() {
  const data = localStorage.getItem(COMMENTS_KEY)
  return data ? JSON.parse(data) : []
}

function saveLocalPosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
}

function saveLocalComments(comments) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments))
}

function normalizeReactions(raw) {
  if (!raw || typeof raw !== 'object') return {}
  const out = {}
  for (const [key, val] of Object.entries(raw)) {
    out[key] = Array.isArray(val) ? val : []
  }
  return out
}

function rowToComment(row) {
  return {
    id: row.id,
    postId: row.post_id ?? row.postId,
    authorUid: row.author_uid ?? row.authorUid,
    authorName: row.author_name ?? row.authorName,
    authorAvatar: row.author_avatar ?? row.authorAvatar ?? null,
    content: row.content,
    createdAt: row.created_at ?? row.createdAt,
  }
}

function rowToPost(row, comments = []) {
  return {
    id: row.id,
    authorUid: row.author_uid ?? row.authorUid,
    authorName: row.author_name ?? row.authorName,
    authorAvatar: row.author_avatar ?? row.authorAvatar ?? null,
    modelId: row.model_id ?? row.modelId ?? null,
    content: row.content ?? '',
    imageUrl: row.image_url ?? row.imageUrl ?? null,
    reactions: normalizeReactions(row.reactions),
    comments,
    createdAt: row.created_at ?? row.createdAt,
  }
}

function mergePostsWithComments(posts, comments) {
  const byPost = {}
  for (const c of comments) {
    const pid = c.postId ?? c.post_id
    if (!byPost[pid]) byPost[pid] = []
    byPost[pid].push(typeof c.postId !== 'undefined' ? c : rowToComment(c))
  }
  return posts.map((p) => {
    const base = p.authorUid ? p : rowToPost(p, [])
    return { ...base, comments: byPost[base.id] || base.comments || [] }
  })
}

function syncStore(posts) {
  useUserStore.getState().syncFeedPosts(posts)
}

export function subscribeToFeedPosts(callback) {
  if (!isConfigured || !supabase) {
    const refresh = () => {
      const posts = getLocalPosts()
      const comments = getLocalComments().map(rowToComment)
      const merged = mergePostsWithComments(posts, comments)
      callback(merged)
      syncStore(merged)
    }
    refresh()
    const interval = setInterval(refresh, 1200)
    return () => clearInterval(interval)
  }

  const refresh = async () => {
    const [{ data: posts, error: pErr }, { data: comments, error: cErr }] = await Promise.all([
      supabase.from('feed_posts').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('feed_post_comments').select('*').order('created_at', { ascending: true }),
    ])

    if (pErr || cErr) {
      callback([])
      return
    }

    const commentRows = (comments || []).map(rowToComment)
    const merged = (posts || []).map((p) =>
      rowToPost(
        p,
        commentRows.filter((c) => c.postId === p.id)
      )
    )
    callback(merged)
    syncStore(merged)
  }

  refresh()

  const channel = supabase
    .channel('feed-posts-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_posts' }, refresh)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_post_comments' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function createFeedPost({
  authorUid,
  authorName,
  authorAvatar = null,
  modelId = null,
  content = '',
  imageUrl = null,
}) {
  const trimmed = content.trim()
  if (!authorUid) throw new Error('ავტორი ვერ მოიძებნა')
  if (!trimmed && !imageUrl) throw new Error('დაწერე ტექსტი ან ატვირთე ფოტო')

  const payload = {
    author_uid: authorUid,
    author_name: authorName || 'მომხმარებელი',
    author_avatar: authorAvatar,
    model_id: modelId,
    content: trimmed,
    image_url: imageUrl,
    reactions: {},
  }

  if (!isConfigured || !supabase) {
    const id = `local_post_${Date.now()}`
    const row = { id, created_at: new Date().toISOString(), ...payload, reactions: {} }
    const stored = [row, ...getLocalPosts()]
    saveLocalPosts(stored)
    const merged = mergePostsWithComments(stored, getLocalComments().map(rowToComment))
    syncStore(merged)
    return rowToPost(row, [])
  }

  const { data, error } = await supabase.from('feed_posts').insert(payload).select().single()
  if (error) throw error
  return rowToPost(data, [])
}

export async function toggleFeedReaction(postId, reactionKey, uid) {
  if (!postId || !reactionKey || !uid) return

  if (!isConfigured || !supabase) {
    const posts = getLocalPosts()
    const updated = posts.map((p) => {
      if (p.id !== postId) return p
      const reactions = normalizeReactions(p.reactions)
      for (const key of Object.keys(reactions)) {
        reactions[key] = reactions[key].filter((x) => x !== uid)
      }
      const list = reactions[reactionKey] || []
      if (!list.includes(uid)) {
        reactions[reactionKey] = [...list, uid]
      }
      return { ...p, reactions }
    })
    saveLocalPosts(updated)
    const merged = mergePostsWithComments(updated, getLocalComments().map(rowToComment))
    syncStore(merged)
    return
  }

  const { data, error } = await supabase.from('feed_posts').select('reactions').eq('id', postId).single()
  if (error) throw error

  const reactions = normalizeReactions(data.reactions)
  for (const key of Object.keys(reactions)) {
    reactions[key] = reactions[key].filter((x) => x !== uid)
  }
  const list = reactions[reactionKey] || []
  if (!list.includes(uid)) {
    reactions[reactionKey] = [...list, uid]
  }

  const { error: writeErr } = await supabase.from('feed_posts').update({ reactions }).eq('id', postId)
  if (writeErr) throw writeErr
}

export async function addFeedComment({
  postId,
  authorUid,
  authorName,
  authorAvatar = null,
  content,
}) {
  const trimmed = content?.trim()
  if (!postId || !authorUid || !trimmed) throw new Error('კომენტარი ცარიელია')

  const payload = {
    post_id: postId,
    author_uid: authorUid,
    author_name: authorName || 'მომხმარებელი',
    author_avatar: authorAvatar,
    content: trimmed,
  }

  if (!isConfigured || !supabase) {
    const id = `local_comment_${Date.now()}`
    const row = { id, created_at: new Date().toISOString(), ...payload }
    const stored = [...getLocalComments(), row]
    saveLocalComments(stored)
    const merged = mergePostsWithComments(getLocalPosts(), stored.map(rowToComment))
    syncStore(merged)
    return rowToComment(row)
  }

  const { data, error } = await supabase.from('feed_post_comments').insert(payload).select().single()
  if (error) throw error
  return rowToComment(data)
}

export function countReactions(reactions) {
  const r = normalizeReactions(reactions)
  return Object.values(r).reduce((sum, arr) => sum + (arr?.length || 0), 0)
}

export function userReaction(reactions, uid) {
  const r = normalizeReactions(reactions)
  for (const type of REACTION_TYPES) {
    if (r[type.key]?.includes(uid)) return type.key
  }
  return null
}

export async function deleteFeedPost(postId) {
  if (!postId) return

  if (!isConfigured || !supabase) {
    const posts = getLocalPosts().filter((p) => p.id !== postId)
    saveLocalPosts(posts)
    const comments = getLocalComments().filter((c) => (c.post_id ?? c.postId) !== postId)
    saveLocalComments(comments)
    const merged = mergePostsWithComments(posts, comments.map(rowToComment))
    syncStore(merged)
    useUserStore.getState().removeFeedPost(postId)
    return
  }

  const { error } = await supabase.from('feed_posts').delete().eq('id', postId)
  if (error) throw error
  useUserStore.getState().removeFeedPost(postId)
}
