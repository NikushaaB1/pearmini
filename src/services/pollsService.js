import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'

const LOCAL_KEY = 'pear_poll_votes'

// Stored structure:
// {
//   item_votes: { [itemId]: ['uid1', 'uid2', ...] },   // Models Poll: per-item votes (ideas + designs)
//   idea_poll:  { [ideaId]: ['uid1', 'uid2', ...] }    // Ideas Poll: exclusive one-vote-per-user
// }

function getLocalVotes() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      item_votes: parsed.item_votes || {},
      idea_poll: parsed.idea_poll || {},
    }
  } catch {
    return { item_votes: {}, idea_poll: {} }
  }
}

function saveLocalVotes(votes) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(votes))
}

// ─── Models Poll: toggle upvote on a single idea or design item ───────────────

export async function toggleItemVote(itemId, uid) {
  if (!itemId || !uid) return

  if (!isConfigured || !supabase) {
    const votes = getLocalVotes()
    const current = votes.item_votes[itemId] || []
    votes.item_votes[itemId] = current.includes(uid)
      ? current.filter((x) => x !== uid)
      : [...current, uid]
    saveLocalVotes(votes)
    return votes.item_votes[itemId]
  }

  // Supabase: upsert into poll_votes table
  const { data: existing } = await supabase
    .from('poll_votes')
    .select('id, voter_uids')
    .eq('item_id', itemId)
    .eq('poll_type', 'item')
    .maybeSingle()

  if (existing) {
    const current = Array.isArray(existing.voter_uids) ? existing.voter_uids : []
    const next = current.includes(uid)
      ? current.filter((x) => x !== uid)
      : [...current, uid]
    await supabase
      .from('poll_votes')
      .update({ voter_uids: next })
      .eq('id', existing.id)
    return next
  } else {
    await supabase.from('poll_votes').insert({
      item_id: itemId,
      poll_type: 'item',
      voter_uids: [uid],
    })
    return [uid]
  }
}

// ─── Ideas Poll: each user may vote for exactly ONE idea (replaces old vote) ──

export async function castIdeaPollVote(ideaId, uid) {
  if (!ideaId || !uid) return

  if (!isConfigured || !supabase) {
    const votes = getLocalVotes()

    // Remove uid from all other ideas first
    Object.keys(votes.idea_poll).forEach((id) => {
      votes.idea_poll[id] = (votes.idea_poll[id] || []).filter((x) => x !== uid)
    })

    // Toggle: if already voted for this idea, unvote; otherwise vote
    const current = votes.idea_poll[ideaId] || []
    const alreadyVoted = current.includes(uid)
    if (!alreadyVoted) {
      votes.idea_poll[ideaId] = [...current, uid]
    }

    saveLocalVotes(votes)
    return { voted: !alreadyVoted, ideaId }
  }

  // Supabase version
  const { data: rows } = await supabase
    .from('poll_votes')
    .select('id, item_id, voter_uids')
    .eq('poll_type', 'idea_poll')

  const allRows = rows || []

  // Remove uid from every row
  for (const row of allRows) {
    const current = Array.isArray(row.voter_uids) ? row.voter_uids : []
    if (current.includes(uid)) {
      await supabase
        .from('poll_votes')
        .update({ voter_uids: current.filter((x) => x !== uid) })
        .eq('id', row.id)
    }
  }

  // Add uid to target idea (unless it was already there — toggle off)
  const targetRow = allRows.find((r) => r.item_id === ideaId)
  const wasVoted = targetRow && (targetRow.voter_uids || []).includes(uid)

  if (!wasVoted) {
    if (targetRow) {
      const updated = [...(targetRow.voter_uids || []).filter((x) => x !== uid), uid]
      await supabase
        .from('poll_votes')
        .update({ voter_uids: updated })
        .eq('id', targetRow.id)
    } else {
      await supabase.from('poll_votes').insert({
        item_id: ideaId,
        poll_type: 'idea_poll',
        voter_uids: [uid],
      })
    }
  }

  return { voted: !wasVoted, ideaId }
}

// ─── Read all votes ────────────────────────────────────────────────────────────

export async function getPollVotes() {
  if (!isConfigured || !supabase) {
    return getLocalVotes()
  }

  const { data, error } = await supabase
    .from('poll_votes')
    .select('item_id, poll_type, voter_uids')

  if (error || !data) return { item_votes: {}, idea_poll: {} }

  const item_votes = {}
  const idea_poll = {}

  for (const row of data) {
    const uids = Array.isArray(row.voter_uids) ? row.voter_uids : []
    if (row.poll_type === 'item') {
      item_votes[row.item_id] = uids
    } else if (row.poll_type === 'idea_poll') {
      idea_poll[row.item_id] = uids
    }
  }

  return { item_votes, idea_poll }
}
