import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Trophy, Star, Crown } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import ModelAvatar from '../components/ui/ModelAvatar'
import { buildLeaderboard, useUserStore } from '../store/useUserStore'

const PODIUM_ORDER = [1, 0, 2] // 2nd, 1st, 3rd visually

export default function Leaderboard() {
  const navigate = useNavigate()
  const models = useUserStore((s) => s.models)
  const points = useUserStore((s) => s.points)
  const leaderboard = useMemo(() => buildLeaderboard(models, points), [models, points])

  const maxPoints = useMemo(
    () => Math.max(50, ...leaderboard.map((m) => m.points)),
    [leaderboard]
  )

  const topThree = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <PageHeader
            eyebrow="რეიტინგი"
            icon={Trophy}
            title="ლიდერბორდი"
            subtitle="მოდელების რეიტინგი ქულების მიხედვით — ყოვედღიური დავალებები, გამოწვევები და მაღაზია"
          />
        </FadeInItem>

        {leaderboard.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Trophy size={24} />
            </div>
            <p className="empty-state-title">მოდელები ჯერ არ არის</p>
          </div>
        ) : (
          <>
            {topThree.length >= 3 && (
              <FadeInItem>
                <div className="leaderboard-podium">
                  {PODIUM_ORDER.map((rankIdx) => {
                    const model = topThree[rankIdx]
                    if (!model) return null
                    const isFirst = rankIdx === 0
                    return (
                      <motion.div
                        key={model.id}
                        className={`podium-card ${isFirst ? 'podium-card--first animate-float-soft' : ''}`}
                        onClick={() => navigate(`/models/${model.id}`)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isFirst && (
                          <Crown
                            size={18}
                            className="text-[var(--accent-bright)] mb-1 animate-pulse-glow"
                          />
                        )}
                        <span className="podium-rank">
                          {rankIdx === 0 ? '🥇' : rankIdx === 1 ? '🥈' : '🥉'}
                        </span>
                        <ModelAvatar
                          src={model.avatar}
                          name={model.name}
                          size={isFirst ? 'md' : 'sm'}
                          className={`!rounded-2xl ${isFirst ? '!w-16 !h-16' : '!w-12 !h-12'}`}
                        />
                        <p className="podium-name">{model.name}</p>
                        <p className="podium-points mt-1">{model.points}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">ქულა</p>
                      </motion.div>
                    )
                  })}
                </div>
              </FadeInItem>
            )}

            <div className="space-y-3">
              {(topThree.length < 3 ? leaderboard : rest).map((model, i) => {
                const rank = topThree.length < 3 ? i : i + 3
                const progress = (model.points / maxPoints) * 100

                return (
                  <FadeInItem key={model.id}>
                    <Card
                      hover
                      onClick={() => navigate(`/models/${model.id}`)}
                      className={rank === 0 ? 'card-pinned' : ''}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="text-2xl sm:text-3xl w-10 sm:w-12 text-center shrink-0">
                          {rank === 0 ? (
                            '🥇'
                          ) : rank === 1 ? (
                            '🥈'
                          ) : rank === 2 ? (
                            '🥉'
                          ) : (
                            <span className="text-base text-[var(--text-muted)] font-semibold">
                              #{rank + 1}
                            </span>
                          )}
                        </div>

                        <ModelAvatar
                          src={model.avatar}
                          name={model.name}
                          size="sm"
                          className="!rounded-xl shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate text-[var(--text-primary)]">
                              {model.name}
                            </h3>
                            {rank === 0 && (
                              <span className="elite-chip">
                                <Star size={10} />
                                ელიტა
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] truncate">{model.tagline}</p>

                          <div className="progress-bar mt-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.9, delay: rank * 0.08, ease: [0.22, 1, 0.36, 1] }}
                              className="progress-bar-fill"
                            />
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xl sm:text-2xl font-bold text-[var(--accent-bright)]">
                            {model.points}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)]">ქულა</p>
                        </div>
                      </div>
                    </Card>
                  </FadeInItem>
                )
              })}
            </div>
          </>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
