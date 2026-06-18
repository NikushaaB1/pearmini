import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Star, Image, ArrowRight, Upload, Edit3, Phone } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import PageHeader from '../components/ui/PageHeader'
import ModelAvatar from '../components/ui/ModelAvatar'
import { SkeletonCard } from '../components/ui/Loader'
import { buildLeaderboard, useUserStore } from '../store/useUserStore'
import { getModelImages } from '../services/storage'
import { isAdminRole } from '../utils/roles'

export default function ModelsOverview() {
  const navigate = useNavigate()
  const { points, models, modelId, role } = useUserStore()
  const leaderboard = useMemo(() => buildLeaderboard(models, points), [models, points])
  const [uploadCounts, setUploadCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const counts = {}
      await Promise.all(
        models.map(async (m) => {
          const imgs = await getModelImages(m.id, 'uploaded')
          counts[m.id] = imgs.length
        })
      )
      setUploadCounts(counts)
      setLoading(false)
    }
    load()
  }, [models])

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <PageHeader
            eyebrow="გუნდი"
            title="მოდელები"
            subtitle="პროფილები, ატვირთვები და ქულები — ყველაფერი ერთ სივრცეში"
          />
        </FadeInItem>

        {models.length === 0 ? (
          <div className="elite-panel p-12 text-center">
            <Users className="mx-auto text-[var(--text-subtle)] mb-3" size={36} />
            <p className="text-[var(--text-muted)]">მოდელები ჯერ არ არის. შექმენი ადმინ პანელიდან.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {models.map((model, idx) => {
              const modelPoints = points[model.id] || 0
              const uploads = uploadCounts[model.id] ?? 0
              const rank = leaderboard.findIndex((m) => m.id === model.id) + 1
              const isMine = modelId === model.id

              return (
                <FadeInItem key={model.id}>
                  {loading ? (
                    <SkeletonCard className="h-72 rounded-2xl" />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="elite-panel elite-panel-glow p-5 sm:p-6 relative"
                    >
                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <ModelAvatar src={model.avatar} name={model.name} size="md" className="!rounded-2xl" />
                        <span className="elite-chip">#{rank}</span>
                      </div>

                      <h3 className="text-xl font-bold text-[var(--text-primary)] relative z-10">{model.name}</h3>
                      <p className="text-sm text-[var(--text-muted)] mt-1 relative z-10">{model.tagline}</p>

                      {model.phone_number && (
                        <p className="text-xs text-[var(--text-subtle)] mt-2 flex items-center gap-1 relative z-10">
                          <Phone size={12} />
                          {model.phone_number}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-3 mt-5 relative z-10">
                        <div className="elite-stat">
                          <div className="elite-stat-label">
                            <Star size={11} />
                            ქულები
                          </div>
                          <p className="elite-stat-value">{modelPoints}</p>
                        </div>
                        <div className="elite-stat">
                          <div className="elite-stat-label">
                            <Image size={11} />
                            ატვირთვები
                          </div>
                          <p className="elite-stat-value">{uploads}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-5 relative z-10">
                        <button
                          onClick={() => navigate(`/models/${model.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-primary)] border transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}
                        >
                          პროფილი <ArrowRight size={13} />
                        </button>
                        <button
                          onClick={() => navigate(`/models/${model.id}?tab=upload`)}
                          className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold text-[var(--accent)] border transition-colors hover:bg-[var(--accent-soft)]"
                          style={{ borderColor: 'rgba(196,149,106,0.25)' }}
                          title="ატვირთვები"
                        >
                          <Upload size={14} />
                        </button>
                        {(isMine || isAdminRole(role)) && (
                          <button
                            onClick={() => navigate(`/models/${model.id}?tab=settings`)}
                            className="flex items-center justify-center px-3 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] border transition-colors hover:text-[var(--accent)] hover:border-[var(--accent)]"
                            style={{ borderColor: 'var(--border-subtle)' }}
                            title="რედაქტირება"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </FadeInItem>
              )
            })}
          </div>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
