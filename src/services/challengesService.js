import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { adjustModelPoints } from './pointsService'
import { logActivityEntry } from './activityService'
import { useUserStore } from '../store/useUserStore'

const LOCAL_KEY = 'pear_challenges'

function getLocalChallenges() {
  const data = localStorage.getItem(LOCAL_KEY)
  if (!data) {
    const initial = [
      {
        id: 'challenge_1',
        title: 'ატვირთე ყველაზე კრეატიული ფოტო',
        description: 'აჩვენე შენი კრეატიულობა ახალ ფოტოსესიაში. საუკეთესო კადრი მიიღებს ჯილდოს!',
        points_reward: 200,
        status: 'active',
        winner_id: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'challenge_2',
        title: 'შექმენი საუკეთესო ვიდეო',
        description: 'გადაიღე მოკლე, ესთეტიკური ვიდეო PEAR ბრენდისთვის.',
        points_reward: 300,
        status: 'active',
        winner_id: null,
        created_at: new Date().toISOString(),
      },
      {
        id: 'challenge_3',
        title: 'მოიფიქრე საუკეთესო იდეა ბრენდისთვის',
        description: 'დაწერე საუკეთესო იდეა ბრენდის განვითარებისთვის იდეების დაფაზე.',
        points_reward: 200,
        status: 'active',
        winner_id: null,
        created_at: new Date().toISOString(),
      }
    ]
    localStorage.setItem(LOCAL_KEY, JSON.stringify(initial))
    return initial
  }
  return JSON.parse(data)
}

function saveLocalChallenges(challenges) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(challenges))
  useUserStore.getState().syncChallenges(challenges)
}

function rowToChallenge(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    pointsReward: row.points_reward,
    status: row.status,
    winnerId: row.winner_id,
    createdAt: row.created_at,
  }
}

export function subscribeToChallenges(callback) {
  if (!isConfigured || !supabase) {
    const local = getLocalChallenges()
    callback(local.map(rowToChallenge))
    const interval = setInterval(() => {
      callback(getLocalChallenges().map(rowToChallenge))
    }, 1000)
    return () => clearInterval(interval)
  }

  const refresh = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      callback([])
      return
    }
    callback((data || []).map(rowToChallenge))
  }

  refresh()

  const channel = supabase
    .channel('challenges-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, refresh)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function createChallenge({ title, description, pointsReward = 100 }) {
  if (!title.trim() || !description.trim()) {
    throw new Error('სათაური და აღწერა აუცილებელია')
  }

  const challenge = {
    title: title.trim(),
    description: description.trim(),
    points_reward: Math.max(0, pointsReward),
    status: 'active',
    winner_id: null,
  }

  if (!isConfigured || !supabase) {
    const id = `local_challenge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const createdAt = new Date().toISOString()
    const stored = [
      { id, created_at: createdAt, ...challenge },
      ...getLocalChallenges(),
    ]
    saveLocalChallenges(stored)
    return rowToChallenge(stored[0])
  }

  const { data, error } = await supabase
    .from('challenges')
    .insert(challenge)
    .select()
    .single()

  if (error) throw error
  return rowToChallenge(data)
}

export async function rewardWinner(challengeId, winnerId) {
  if (!challengeId || !winnerId) throw new Error('მონაცემები არასრულია')

  if (!isConfigured || !supabase) {
    const challenges = getLocalChallenges()
    const idx = challenges.findIndex((c) => c.id === challengeId)
    if (idx === -1) throw new Error('გამოწვევა ვერ მოიძებნა')

    if (challenges[idx].status === 'completed') {
      throw new Error('ამ გამოწვევაში გამარჯვებული უკვე გამოვლენილია')
    }

    challenges[idx].status = 'completed'
    challenges[idx].winner_id = winnerId
    saveLocalChallenges(challenges)

    const rewardPoints = challenges[idx].points_reward || 100
    useUserStore.getState().addPoints(winnerId, rewardPoints)

    return rowToChallenge(challenges[idx])
  }

  const { data: challenge, error: readErr } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single()

  if (readErr) throw readErr
  if (challenge.status === 'completed') {
    throw new Error('ამ გამოწვევაში გამარჯვებული უკვე გამოვლენილია')
  }

  const { data: updated, error: writeErr } = await supabase
    .from('challenges')
    .update({ status: 'completed', winner_id: winnerId })
    .eq('id', challengeId)
    .select()
    .single()

  if (writeErr) throw writeErr

  const rewardPoints = challenge.points_reward || 100
  await adjustModelPoints(winnerId, rewardPoints)

  const modelName = useUserStore.getState().getModelById(winnerId)?.name || winnerId
  await logActivityEntry(`გაიმარჯვა გამოწვევაში "${challenge.title}" (+${rewardPoints} ქულა)`, modelName)

  return rowToChallenge(updated)
}

export async function deleteChallenge(challengeId) {
  if (!isConfigured || !supabase) {
    const challenges = getLocalChallenges()
    saveLocalChallenges(challenges.filter((c) => c.id !== challengeId))
    return
  }

  const { error } = await supabase.from('challenges').delete().eq('id', challengeId)
  if (error) throw error
}

export async function updateChallenge(challenge) {
  if (!challenge.id) throw new Error('გამოწვევის ID აუცილებელია')
  if (!challenge.title?.trim()) throw new Error('სათაური აუცილებელია')

  const updateData = {
    title: challenge.title.trim(),
    description: challenge.description?.trim() || '',
    points_reward: Math.max(0, challenge.pointsReward || 0),
  }

  if (!isConfigured || !supabase) {
    const challenges = getLocalChallenges()
    const idx = challenges.findIndex((c) => c.id === challenge.id)
    if (idx === -1) throw new Error('გამოწვევა ვერ მოიძებნა')

    challenges[idx] = {
      ...challenges[idx],
      title: updateData.title,
      description: updateData.description,
      points_reward: updateData.points_reward,
    }
    saveLocalChallenges(challenges)
    return rowToChallenge(challenges[idx])
  }

  const { data: updated, error } = await supabase
    .from('challenges')
    .update(updateData)
    .eq('id', challenge.id)
    .select()
    .single()

  if (error) throw error
  return rowToChallenge(updated)
}

