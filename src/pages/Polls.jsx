import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Vote,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Image as ImageIcon,
  Check,
  Users,
  BarChart2,
  ThumbsUp,
  Crown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import ModelAvatar from '../components/ui/ModelAvatar'
import { useUserStore } from '../store/useUserStore'
import { toggleItemVote, castIdeaPollVote, getPollVotes } from '../services/pollsService'

// ─── Helper ────────────────────────────────────────────────────────────────────

function VoteBar({ count, max, color = 'var(--accent)' }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color, minWidth: 28 }}>
        {pct}%
      </span>
    </div>
  )
}

// ─── Tab 1: Models Poll ────────────────────────────────────────────────────────

function ModelPollCard({ model, ideas, designs, votes, uid, onVote }) {
  const [expanded, setExpanded] = useState(false)

  const myIdeas = ideas.filter((i) => i.senderUid === model.uid || i.senderName === model.name)
  const myDesigns = designs.filter((d) => d.modelId === model.id)
  const totalItems = myIdeas.length + myDesigns.length

  const totalVotes = [
    ...myIdeas.map((i) => (votes.item_votes[i.id] || []).length),
    ...myDesigns.map((d) => (votes.item_votes[d.id] || []).length),
  ].reduce((a, b) => a + b, 0)

  if (totalItems === 0) return null

  return (
    <motion.div
      layout
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card-solid)' }}
    >
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] transition-colors text-left"
      >
        <ModelAvatar src={model.avatar} name={model.name} size="md" className="!rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{model.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {myIdeas.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
                <Lightbulb size={9} className="text-amber-400" />
                {myIdeas.length} იდეა
              </span>
            )}
            {myDesigns.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full">
                <ImageIcon size={9} className="text-[var(--accent)]" />
                {myDesigns.length} დიზაინი
              </span>
            )}
            {totalVotes > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent)]">
                <ThumbsUp size={9} />
                {totalVotes} ხმა
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-[var(--text-subtle)]">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="border-t px-4 pb-4 pt-3 space-y-4"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {/* Ideas */}
              {myIdeas.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                    <Lightbulb size={11} /> იდეები
                  </p>
                  <div className="space-y-2">
                    {myIdeas.map((idea) => {
                      const itemVoters = votes.item_votes[idea.id] || []
                      const voted = itemVoters.includes(uid)
                      const count = itemVoters.length
                      const maxVotes = Math.max(
                        1,
                        ...ideas.map((i) => (votes.item_votes[i.id] || []).length)
                      )
                      return (
                        <div
                          key={idea.id}
                          className="rounded-xl p-3 border flex flex-col gap-2"
                          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}
                        >
                          <p className="text-xs text-[var(--text-primary)] leading-relaxed">{idea.text}</p>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <VoteBar count={count} max={maxVotes} color="#f59e0b" />
                              <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">{count} ხმა</p>
                            </div>
                            <button
                              onClick={() => onVote('item', idea.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 ${
                                voted
                                  ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40'
                                  : 'border text-[var(--text-muted)] hover:text-amber-400 hover:border-amber-400/40 hover:bg-amber-400/10'
                              }`}
                              style={{ borderColor: voted ? undefined : 'var(--border-subtle)' }}
                            >
                              {voted ? <Check size={12} /> : <ThumbsUp size={12} />}
                              {voted ? 'ხმა მიეცა' : 'ხმა'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Designs */}
              {myDesigns.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent)] mb-2 flex items-center gap-1.5">
                    <ImageIcon size={11} /> დიზაინები
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {myDesigns.map((design) => {
                      const itemVoters = votes.item_votes[design.id] || []
                      const voted = itemVoters.includes(uid)
                      const count = itemVoters.length
                      const maxVotes = Math.max(
                        1,
                        ...designs.map((d) => (votes.item_votes[d.id] || []).length)
                      )
                      return (
                        <div
                          key={design.id}
                          className="rounded-xl overflow-hidden border flex flex-col"
                          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card-solid)' }}
                        >
                          <div className="aspect-video relative overflow-hidden">
                            <img
                              src={design.imageUrl}
                              alt={design.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-2 flex flex-col gap-1.5">
                            <p className="text-[11px] font-semibold text-[var(--text-primary)] line-clamp-1">
                              {design.title}
                            </p>
                            <VoteBar count={count} max={maxVotes} />
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-[var(--text-subtle)]">{count} ხმა</span>
                              <button
                                onClick={() => onVote('item', design.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                  voted
                                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                                    : 'text-[var(--text-subtle)] hover:text-[var(--accent)] hover:bg-[var(--accent-soft)]'
                                }`}
                              >
                                {voted ? <Check size={10} /> : <ThumbsUp size={10} />}
                                {voted ? 'მიეცა' : 'ხმა'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Tab 2: Ideas Poll ─────────────────────────────────────────────────────────

function IdeasPollSection({ ideas, models, votes, uid, onIdeaVote }) {
  const userVotedIdeaId = Object.entries(votes.idea_poll || {}).find(
    ([, uids]) => uids.includes(uid)
  )?.[0]

  const sortedIdeas = [...ideas].sort(
    (a, b) => (votes.idea_poll[b.id] || []).length - (votes.idea_poll[a.id] || []).length
  )

  const maxVotes = Math.max(1, ...sortedIdeas.map((i) => (votes.idea_poll[i.id] || []).length))
  const totalVotes = sortedIdeas.reduce(
    (sum, i) => sum + (votes.idea_poll[i.id] || []).length,
    0
  )

  if (ideas.length === 0) {
    return (
      <div className="py-20 text-center border rounded-2xl" style={{ borderColor: 'var(--border-subtle)' }}>
        <Lightbulb size={36} className="text-[var(--text-subtle)] mx-auto mb-3" />
        <p className="text-sm text-[var(--text-muted)]">იდეები ჯერ არ არის</p>
        <p className="text-xs text-[var(--text-subtle)] mt-1">ჩატში დაწერე შენი იდეა</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Poll header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl border"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}
      >
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-[var(--accent)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            სულ {totalVotes} ხმა
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          {userVotedIdeaId ? '✓ ხმა მიეცა' : 'ირჩიე საუკეთესო იდეა'}
        </span>
      </div>

      {/* Ideas list as poll options */}
      <AnimatePresence>
        {sortedIdeas.map((idea, idx) => {
          const creator = models.find(
            (m) => m.name === idea.senderName || m.id === idea.senderUid
          )
          const voteCount = (votes.idea_poll[idea.id] || []).length
          const isVoted = userVotedIdeaId === idea.id
          const isWinning = idx === 0 && voteCount > 0

          return (
            <motion.div
              key={idea.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
            >
              <button
                onClick={() => onIdeaVote(idea.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all group ${
                  isVoted
                    ? 'ring-2 ring-[var(--accent)] border-[var(--accent)]'
                    : 'hover:border-[var(--accent)]/50 hover:bg-[var(--bg-hover)]'
                }`}
                style={{
                  borderColor: isVoted ? 'var(--accent)' : 'var(--border-subtle)',
                  background: isVoted ? 'var(--accent-soft)' : 'var(--bg-card-solid)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Model avatar */}
                  <div className="relative shrink-0">
                    <ModelAvatar
                      src={creator?.avatar || idea.senderAvatar}
                      name={idea.senderName}
                      size="sm"
                      className="!rounded-xl"
                    />
                    {isWinning && (
                      <Crown
                        size={13}
                        className="absolute -top-1.5 -right-1.5 text-amber-400 drop-shadow-sm"
                        fill="currentColor"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + vote badge */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {idea.senderName}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isVoted && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full">
                            <Check size={9} /> შენი ხმა
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-[var(--text-muted)]">
                          {voteCount} ხმა
                        </span>
                      </div>
                    </div>

                    {/* Idea text */}
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3">
                      {idea.text}
                    </p>

                    {/* Vote bar */}
                    <VoteBar count={voteCount} max={maxVotes} />
                  </div>
                </div>
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <p className="text-[10px] text-center text-[var(--text-subtle)] pt-2">
        ხმის შეცვლა შეგიძლია — დააჭირე სხვა იდეას
      </p>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Polls() {
  const { user, ideas, designs, models } = useUserStore()
  const uid = user?.uid

  const [activeTab, setActiveTab] = useState('models')
  const [votes, setVotes] = useState({ item_votes: {}, idea_poll: {} })
  const [loading, setLoading] = useState(true)

  const loadVotes = useCallback(async () => {
    try {
      const data = await getPollVotes()
      setVotes(data)
    } catch (err) {
      console.error('Failed to load poll votes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVotes()
  }, [loadVotes])

  const handleItemVote = async (type, itemId) => {
    if (!uid) return toast.error('ხმის მიცემისთვის შედი სისტემაში')
    try {
      await toggleItemVote(itemId, uid)
      await loadVotes()
    } catch (err) {
      toast.error('შეცდომა: ' + (err.message || ''))
    }
  }

  const handleIdeaVote = async (ideaId) => {
    if (!uid) return toast.error('ხმის მიცემისთვის შედი სისტემაში')
    try {
      const result = await castIdeaPollVote(ideaId, uid)
      await loadVotes()
      if (result?.voted) {
        toast.success('ხმა მიეცა!')
      }
    } catch (err) {
      toast.error('შეცდომა: ' + (err.message || ''))
    }
  }

  // Build model list that has at least one idea or design
  const modelsWithContent = models.filter((model) => {
    const hasIdea = ideas.some(
      (i) => i.senderName === model.name || i.senderUid === model.uid
    )
    const hasDesign = designs.some((d) => d.modelId === model.id)
    return hasIdea || hasDesign
  })

  const tabs = [
    { id: 'models', label: 'მოდელების POLL', icon: Users },
    { id: 'ideas', label: 'იდეების POLL', icon: Lightbulb },
  ]

  return (
    <PageTransition>
      <FadeInContainer>
        {/* ── Page header ── */}
        <FadeInItem>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[var(--accent)] text-xs uppercase tracking-[0.2em] mb-2">
                <Sparkles size={12} />
                კენჭისყრა
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
                <Vote size={30} strokeWidth={1.5} className="text-[var(--accent)]" />
                POLL
              </h1>
              <p className="text-[var(--text-muted)] mt-1.5">
                მისცე ხმა საუკეთესო იდეებს და დიზაინებს
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'nav-link-active'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </FadeInItem>

        {/* ── Tab 1: Models Poll ── */}
        {activeTab === 'models' && (
          <FadeInItem>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Users size={16} className="text-[var(--accent)]" />
                  მოდელების კონტრიბუციები
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  დააჭირე მოდელის ბარათს, ნახე მათი იდეები და დიზაინები — ხმა მიეცი
                </p>
              </div>
              <span className="text-xs text-[var(--text-subtle)] bg-[var(--bg-hover)] px-3 py-1.5 rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
                {modelsWithContent.length} მოდელი
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <p className="text-sm text-[var(--text-muted)]">იტვირთება...</p>
              </div>
            ) : modelsWithContent.length === 0 ? (
              <div className="py-20 text-center border rounded-2xl" style={{ borderColor: 'var(--border-subtle)' }}>
                <Users size={36} className="text-[var(--text-subtle)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)]">მოდელებს ჯერ არ აქვთ კონტრიბუციები</p>
                <p className="text-xs text-[var(--text-subtle)] mt-1">
                  ჩატში დაწერე იდეა ან ატვირთე დიზაინი
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {modelsWithContent.map((model) => (
                  <ModelPollCard
                    key={model.id}
                    model={model}
                    ideas={ideas}
                    designs={designs}
                    votes={votes}
                    uid={uid}
                    onVote={handleItemVote}
                  />
                ))}
              </div>
            )}
          </FadeInItem>
        )}

        {/* ── Tab 2: Ideas Poll ── */}
        {activeTab === 'ideas' && (
          <FadeInItem>
            <div className="mb-5">
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-400" />
                საუკეთესო იდეის POLL
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                ირჩიე ერთი — ყველაზე ინტერესური და კრეატიული იდეა
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: poll options */}
              <div>
                {loading ? (
                  <div className="py-20 text-center">
                    <p className="text-sm text-[var(--text-muted)]">იტვირთება...</p>
                  </div>
                ) : (
                  <IdeasPollSection
                    ideas={ideas}
                    models={models}
                    votes={votes}
                    uid={uid}
                    onIdeaVote={handleIdeaVote}
                  />
                )}
              </div>

              {/* Right: models leaderboard for Ideas Poll */}
              <div>
                <div
                  className="rounded-2xl border p-4"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card-solid)' }}
                >
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <BarChart2 size={15} className="text-[var(--accent)]" />
                    ლიდერბორდი — იდეების POLL
                  </h3>

                  {ideas.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] py-4 text-center">იდეები არ არის</p>
                  ) : (
                    <div className="space-y-2">
                      {[...ideas]
                        .sort(
                          (a, b) =>
                            (votes.idea_poll[b.id] || []).length -
                            (votes.idea_poll[a.id] || []).length
                        )
                        .map((idea, idx) => {
                          const creator = models.find(
                            (m) => m.name === idea.senderName || m.id === idea.senderUid
                          )
                          const voteCount = (votes.idea_poll[idea.id] || []).length
                          const totalIdeasVotes = ideas.reduce(
                            (sum, i) => sum + (votes.idea_poll[i.id] || []).length,
                            0
                          )
                          const pct =
                            totalIdeasVotes > 0
                              ? Math.round((voteCount / totalIdeasVotes) * 100)
                              : 0
                          return (
                            <div
                              key={idea.id}
                              className="flex items-center gap-3 py-2 border-b last:border-0"
                              style={{ borderColor: 'var(--border-subtle)' }}
                            >
                              <span
                                className={`text-xs font-black w-5 text-center shrink-0 ${
                                  idx === 0
                                    ? 'text-amber-400'
                                    : idx === 1
                                    ? 'text-slate-400'
                                    : idx === 2
                                    ? 'text-amber-700'
                                    : 'text-[var(--text-subtle)]'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <ModelAvatar
                                src={creator?.avatar || idea.senderAvatar}
                                name={idea.senderName}
                                size="xs"
                                className="!rounded-lg shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                                  {idea.senderName}
                                </p>
                                <p className="text-[10px] text-[var(--text-subtle)] truncate">
                                  {idea.text}
                                </p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-xs font-bold text-[var(--accent)]">{voteCount}</p>
                                <p className="text-[9px] text-[var(--text-subtle)]">{pct}%</p>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>

                {/* Models who have ideas — info panel */}
                {models.filter((m) =>
                  ideas.some((i) => i.senderName === m.name || i.senderUid === m.uid)
                ).length > 0 && (
                  <div
                    className="mt-4 rounded-2xl border p-4"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card-solid)' }}
                  >
                    <h3 className="text-xs font-bold text-[var(--text-muted)] mb-3 uppercase tracking-widest flex items-center gap-2">
                      <Users size={12} />
                      მოდელები — იდეების ავტორები
                    </h3>
                    <div className="space-y-2">
                      {models
                        .filter((m) =>
                          ideas.some((i) => i.senderName === m.name || i.senderUid === m.uid)
                        )
                        .map((model) => {
                          const modelIdeas = ideas.filter(
                            (i) => i.senderName === model.name || i.senderUid === model.uid
                          )
                          const modelVotes = modelIdeas.reduce(
                            (sum, i) => sum + (votes.idea_poll[i.id] || []).length,
                            0
                          )
                          return (
                            <div key={model.id} className="flex items-center gap-2.5">
                              <ModelAvatar
                                src={model.avatar}
                                name={model.name}
                                size="xs"
                                className="!rounded-lg !w-7 !h-7 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                  {model.name}
                                </p>
                                <p className="text-[10px] text-[var(--text-subtle)]">
                                  {modelIdeas.length} იდეა
                                </p>
                              </div>
                              {modelVotes > 0 && (
                                <span className="text-xs font-bold text-[var(--accent)] shrink-0">
                                  {modelVotes} ხმა
                                </span>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FadeInItem>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
