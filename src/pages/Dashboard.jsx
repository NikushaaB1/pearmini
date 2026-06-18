import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Upload,
  Megaphone,
  Trophy,
  MessageCircle,
  ArrowRight,
  Star,
  Image,
  User,
  Sparkles,
  Crown,
  Edit3,
  ListChecks,
} from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import ModelAvatar from '../components/ui/ModelAvatar'
import { useUserStore } from '../store/useUserStore'
import { isAdminRole } from '../utils/roles'
import { getModelImages } from '../services/storage'

const quickActions = [
  { title: 'მოდელები', desc: 'პროფილები და სტატისტიკა', icon: Users, to: '/models', color: 'var(--accent)' },
  { title: 'ატვირთვები', desc: 'გალერეა და ფოტოები', icon: Upload, to: null, color: '#e8b896' },
  { title: 'განცხადებები', desc: 'სიახლეები და შეტყობინებები', icon: Megaphone, to: '/announcements', color: '#c4956a' },
  { title: 'ლიდერბორდი', desc: 'რეიტინგი და ქულები', icon: Trophy, to: '/leaderboard', color: '#d4a574' },
  { title: 'ჩატი', desc: 'საერთო სივრცე', icon: MessageCircle, to: '/chat', color: '#a67c52' },
  { title: 'დავალებები', desc: 'ყოველდღიური ამოცანები', icon: ListChecks, to: '/daily-tasks', color: '#b8860b' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, role, modelId, getLeaderboard, announcements, getModels, billboardModelId, points } =
    useUserStore()
  const leaderboard = getLeaderboard()
  const models = getModels()
  const billboardModel = billboardModelId ? models.find((m) => m.id === billboardModelId) : null
  const [uploadCounts, setUploadCounts] = useState({})

  const uploadsRoute = isAdminRole(role) ? '/uploads' : modelId ? `/models/${modelId}?tab=upload` : '/dashboard'

  const actions = useMemo(
    () =>
      quickActions.map((a) =>
        a.title === 'ატვირთვები' ? { ...a, to: uploadsRoute } : a
      ),
    [uploadsRoute]
  )

  const firstName = user?.displayName?.split(/[\s"'/]/)[0] || 'ელიტა'

  useEffect(() => {
    async function load() {
      const counts = {}
      await Promise.all(
        models.map(async (m) => {
          try {
            const imgs = await getModelImages(m.id, 'uploaded')
            counts[m.id] = imgs.length
          } catch {
            counts[m.id] = 0
          }
        })
      )
      setUploadCounts(counts)
    }
    if (models.length) load()
  }, [models])

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <PageHeader
            eyebrow="სამუშაო დაფა"
            title={`გამარჯობა, ${firstName}`}
            subtitle="შენი ელიტური სივრცე — მოდელები, ატვირთვები და ქულები ერთ ადგილას"
          />
        </FadeInItem>

        {billboardModel && (
          <FadeInItem>
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="elite-panel elite-panel-glow mb-8 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative"
            >
              <div className="flex-1 space-y-3 relative z-10 text-center md:text-left">
                <span className="elite-chip">
                  <Crown size={11} />
                  Virtual Billboard
                </span>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                  PEAR™ Elite ოფიციალური სახე
                </h2>
                <p className="text-sm text-[var(--text-muted)] max-w-md">
                  კვირის ლიდერი და ოფიციალური წარმომადგენელი — ქულების მაღაზიიდან მოპოვებული სტატუსი
                </p>
                <p className="text-lg font-semibold text-[var(--accent)]">{billboardModel.name}</p>
                <p className="text-xs text-[var(--text-subtle)] italic">{billboardModel.tagline}</p>
              </div>
              <div className="shrink-0 relative z-10 p-1 rounded-full" style={{ background: 'var(--nav-gold)' }}>
                <ModelAvatar
                  src={billboardModel.avatar}
                  name={billboardModel.name}
                  size="lg"
                  className="!w-20 !h-20 sm:!w-24 sm:!h-24 !rounded-full"
                />
              </div>
            </motion.div>
          </FadeInItem>
        )}

        <FadeInItem>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-10">
            {actions.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="elite-action-card"
                onClick={() => navigate(card.to)}
              >
                <div className="elite-action-card-icon">
                  <card.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">{card.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{card.desc}</p>
                <ArrowRight size={14} className="mt-4 text-[var(--accent)]" />
              </motion.div>
            ))}
          </div>
        </FadeInItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <FadeInItem>
            <div className="elite-panel p-5 sm:p-6 h-full">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <Trophy size={18} className="text-[var(--accent)]" />
                ტოპ რეიტინგი
              </h3>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-8 text-center">მოდელები ჯერ არ არის</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((model, i) => (
                    <motion.div
                      key={model.id}
                      whileHover={{ x: 4 }}
                      onClick={() => navigate(`/models/${model.id}`)}
                      className="model-row cursor-pointer"
                    >
                      <span className="w-7 text-center shrink-0 text-sm">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                      <ModelAvatar src={model.avatar} name={model.name} size="xs" className="!rounded-xl" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{model.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">{model.tagline}</p>
                      </div>
                      <span className="elite-chip shrink-0">{model.points} ქ.</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </FadeInItem>

          <FadeInItem>
            <div className="elite-panel p-5 sm:p-6 h-full">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <Megaphone size={18} className="text-[var(--accent)]" />
                სიახლეები
              </h3>
              <div className="space-y-2">
                {announcements.slice(0, 4).map((ann) => (
                  <div
                    key={ann.id}
                    onClick={() => navigate('/announcements')}
                    className="p-3.5 rounded-xl cursor-pointer border transition-colors hover:border-[var(--border-medium)]"
                    style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{ann.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <p className="text-sm text-[var(--text-muted)] py-8 text-center">განცხადებები ცარიელია</p>
                )}
              </div>
            </div>
          </FadeInItem>
        </div>

        {/* Models list with uploads */}
        <FadeInItem>
          <div className="elite-panel p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="page-eyebrow mb-1">
                  <Sparkles size={10} />
                  მოდელები
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">გუნდი და ატვირთვები</h3>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  ყველა მოდელის პროფილი, ფოტოები და რედაქტირება
                </p>
              </div>
              <button
                onClick={() => navigate('/models')}
                className="elite-chip cursor-pointer hover:opacity-90 transition-opacity"
              >
                ყველა <ArrowRight size={12} />
              </button>
            </div>

            {models.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-10">მოდელები ჯერ არ არის</p>
            ) : (
              <div className="space-y-3">
                {models.map((model, i) => {
                  const modelPoints = points[model.id] || 0
                  const uploads = uploadCounts[model.id] ?? 0
                  const rank = leaderboard.findIndex((m) => m.id === model.id) + 1
                  const isMine = modelId === model.id

                  return (
                    <motion.div
                      key={model.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="model-row"
                    >
                      <span className="text-xs font-bold text-[var(--text-subtle)] w-6 text-center shrink-0">
                        #{rank}
                      </span>
                      <ModelAvatar src={model.avatar} name={model.name} size="sm" className="!rounded-xl shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-[var(--text-primary)] truncate">{model.name}</p>
                          {isMine && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
                              შენი
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">{model.tagline}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1">
                            <Star size={10} className="text-[var(--accent)]" />
                            {modelPoints} ქულა
                          </span>
                          <span className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1">
                            <Image size={10} />
                            {uploads} ატვირთვა
                          </span>
                        </div>
                      </div>
                      <div className="model-row-actions">
                        <button
                          onClick={() => navigate(`/models/${model.id}`)}
                          className="p-2 rounded-lg border text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                          style={{ borderColor: 'var(--border-subtle)' }}
                          title="პროფილი"
                        >
                          <User size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/models/${model.id}?tab=upload`)}
                          className="p-2 rounded-lg border text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                          style={{ borderColor: 'var(--border-subtle)' }}
                          title="ატვირთვები"
                        >
                          <Upload size={15} />
                        </button>
                        {isMine && (
                          <button
                            onClick={() => navigate(`/models/${model.id}?tab=settings`)}
                            className="p-2 rounded-lg border text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
                            style={{ borderColor: 'rgba(196,149,106,0.3)' }}
                            title="რედაქტირება"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        </FadeInItem>

        {isAdminRole(role) && (
          <FadeInItem>
            <Card className="mt-6" onClick={() => navigate('/admin')}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[var(--text-primary)]">ადმინ პანელი</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">ანგარიშები, ქულები და CV-ები</p>
                </div>
                <ArrowRight className="text-[var(--accent)]" />
              </div>
            </Card>
          </FadeInItem>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
