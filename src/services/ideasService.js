import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { useUserStore } from '../store/useUserStore'

const LOCAL_KEY = 'pear_ideas'

function getLocalIdeas() {
  const data = localStorage.getItem(LOCAL_KEY)
  return data ? JSON.parse(data) : []
}

function saveLocalIdeas(ideas) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ideas))
  useUserStore.getState().syncIdeas(ideas)
}

function rowToIdea(row) {
  return {
    id: row.id,
    text: row.text,
    senderUid: row.sender_uid,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    likes: Array.isArray(row.likes) ? row.likes : [],
    createdAt: row.created_at,
  }
}

export function subscribeToIdeas(callback) {
  if (!isConfigured || !supabase) {
    const local = getLocalIdeas()
    callback(local)
    const interval = setInterval(() => {
      callback(getLocalIdeas())
    }, 1000)
    return () => clearInterval(interval)
  }

  const refresh = async () => {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      callback([])
      return
    }
    callback((data || []).map(rowToIdea))
  }

  refresh()

  const channel = supabase
    .channel('ideas-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function createIdea(text, senderUid, senderName, senderAvatar = null) {
  const trimmed = text.trim()
  if (!trimmed || !senderUid) return null

  const idea = {
    text: trimmed,
    sender_uid: senderUid,
    sender_name: senderName || 'მომხმარებელი',
    sender_avatar: senderAvatar || null,
    likes: [],
  }

  if (!isConfigured || !supabase) {
    const id = `local_idea_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const createdAt = new Date().toISOString()
    const stored = [
      { id, created_at: createdAt, ...idea },
      ...getLocalIdeas(),
    ].map(rowToIdea)
    saveLocalIdeas(stored)
    return stored[0]
  }

  const { data, error } = await supabase
    .from('ideas')
    .insert(idea)
    .select()
    .single()

  if (error) throw error
  return rowToIdea(data)
}

export async function toggleLikeIdea(ideaId, uid) {
  if (!ideaId || !uid) return

  if (!isConfigured || !supabase) {
    const ideas = getLocalIdeas()
    const updated = ideas.map((i) => {
      if (i.id === ideaId) {
        const likes = Array.isArray(i.likes) ? i.likes : []
        const nextLikes = likes.includes(uid) ? likes.filter((x) => x !== uid) : [...likes, uid]
        return { ...i, likes: nextLikes }
      }
      return i
    })
    saveLocalIdeas(updated)
    return
  }

  const { data, error: readErr } = await supabase
    .from('ideas')
    .select('likes')
    .eq('id', ideaId)
    .single()

  if (readErr) throw readErr

  const likes = Array.isArray(data?.likes) ? data.likes : []
  const nextLikes = likes.includes(uid) ? likes.filter((x) => x !== uid) : [...likes, uid]

  const { error: writeErr } = await supabase
    .from('ideas')
    .update({ likes: nextLikes })
    .eq('id', ideaId)

  if (writeErr) throw writeErr
}

export async function deleteIdea(ideaId, requesterUid) {
  if (!ideaId || !requesterUid) return

  if (!isConfigured || !supabase) {
    const ideas = getLocalIdeas()
    const target = ideas.find((i) => i.id === ideaId)
    if (!target) return
    const isOwner = target.senderUid === requesterUid
    const isAdmin = useUserStore.getState().role === 'admin' || useUserStore.getState().role === 'head_admin'
    if (!isOwner && !isAdmin) {
      throw new Error('მხოლოდ საკუთარი იდეის წაშლა შეგიძლია')
    }
    const filtered = ideas.filter((i) => i.id !== ideaId)
    saveLocalIdeas(filtered)
    return
  }

  const { error } = await supabase.from('ideas').delete().eq('id', ideaId)
  if (error) throw error
}
