import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'

function rowToRule(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    sortOrder: row.sort_order,
    author: row.author,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function fetchAllRules() {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('platform_rules')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map(rowToRule)
}

export async function createRule({ title, content, sortOrder = 0, author = 'ადმინისტრატორი' }) {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('platform_rules')
    .insert({ title, content, sort_order: sortOrder, author })
    .select()
    .single()
  if (error) throw error
  return rowToRule(data)
}

export function subscribeToRules(callback) {
  if (!isConfigured || !supabase) {
    return () => {}
  }

  const refresh = async () => {
    try {
      callback((await fetchAllRules()) || [])
    } catch {
      callback([])
    }
  }

  refresh()

  const channel = supabase
    .channel('platform-rules-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_rules' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
