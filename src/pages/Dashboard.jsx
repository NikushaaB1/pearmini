import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  Upload,
  Megaphone,
  Trophy,
  MessageCircle,
  ArrowRight,
  Crown,
  ListChecks,
  Sparkles,
  Newspaper,
} from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import DayOverviewCard from '../components/ui/DayOverviewCard'
import ModelAvatar from '../components/ui/ModelAvatar'
import FeedComposer from '../components/feed/FeedComposer'
import FeedPostCard from '../components/feed/FeedPostCard'
import DashboardRightRail from '../components/feed/DashboardRightRail'
import { useUserStore } from '../store/useUserStore'
import { isAdminRole } from '../utils/roles'
import { getProfileAvatar } from '../services/avatarService'
import { subscribeToShineSpotlight, DEFAULT_SHINE_SPOTLIGHT } from '../services/shineSpotlightService'
import ShineWelcomeOverlay from '../components/ui/ShineWelcomeOverlay'

const quickActions = [
  { title: 'მოდელები', desc: 'პროფილები და სტატისტიკა', icon: Users, to: '/models', color: 'var(--accent)' },
  { title: 'ატვირთვები', desc: 'გალერეა და ფოტოები', icon: Upload, to: null, color: '#e8b896' },
  { title: 'განცხადებები', desc: 'ოფიციალური შეტყობინებები', icon: Megaphone, to: '/announcements', color: '#c4956a' },
  { title: 'ლიდერბორდი', desc: 'რეიტინგი და ქულები', icon: Trophy, to: '/leaderboard', color: '#d4a574' },
  { title: 'ჩატი', desc: 'საერთო სივრცე', icon: MessageCircle, to: '/chat', color: '#a67c52' },
  { title: 'დავალებები', desc: 'ყოველდღიური ამოცანები', icon: ListChecks, to: '/daily-tasks', color: '#b8860b' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    user,
    role,
    modelId,
    getLeaderboard,
    announcements,
    getModels,
    billboardModelId,
    points,
    showSplash,
    dailyTasks,
    dailyTaskCompletions,
    dailyTaskPenalties,
    feedPosts,
    userAvatar,
    lastNewPostId,
  } = useUserStore()
  const leaderboard = getLeaderboard()
  const modelsList = getModels()
  const myRank = modelId ? leaderboard.findIndex((m) => m.id === modelId) + 1 : null
  const billboardModel = billboardModelId ? modelsList.find((m) => m.id === billboardModelId) : null
  const [spotlight, setSpotlight] = useState(DEFAULT_SHINE_SPOTLIGHT)
  const [showAd, setShowAd] = useState(false)
  const adHandledRef = useRef(false)

  const firstName = user?.displayName?.split(/[\s"'/]/)[0] || 'ელიტა'
  const profileAvatar = getProfileAvatar({ role, modelId, models: modelsList, userAvatar })
  const authorName = user?.displayName || user?.email || 'ელიტა'
  const myPoints = modelId ? points[modelId] || 0 : null

  useEffect(() => {
    return subscribeToShineSpotlight(setSpotlight)
  }, [])

  useEffect(() => {
    const wantsAd = location.state?.showCampaignAd === true
    if (!wantsAd || adHandledRef.current || showSplash || !spotlight.enabled) return undefined

    const timer = setTimeout(() => {
      adHandledRef.current = true
      setShowAd(true)
      navigate('/dashboard', { replace: true, state: {} })
    }, 800)

    return () => clearTimeout(timer)
  }, [location.state, showSplash, spotlight.enabled, navigate])

  const handleAdClose = () => setShowAd(false)

  const uploadsRoute = isAdminRole(role) ? '/uploads' : modelId ? `/models/${modelId}?tab=upload` : '/dashboard'

  const actions = useMemo(
    () =>
      quickActions.map((a) =>
        a.title === 'ატვირთვები' ? { ...a, to: uploadsRoute } : a
      ),
    [uploadsRoute]
  )

  const handleActionClick = (to) => {
    if (to) navigate(to)
  }

  return (
    <PageTransition>
      <ShineWelcomeOverlay
        visible={showAd}
        title={spotlight.title}
        subtitle={spotlight.subtitle}
        description={spotlight.description}
        imageUrl={spotlight.imageUrl}
        onClose={handleAdClose}
      />
      <FadeInContainer>
        <div className="dashboard-layout dashboard-home">
          <div className="dashboard-main-column">
            <FadeInItem>
              <PageHeader
                eyebrow="მთავარი"
                title={`გამარჯობა, ${firstName}`}
                subtitle="გუნდის ფიდი, სწრაფი წვდომა და განახლებები ერთ ადგილას"
              />
            </FadeInItem>

            {(myPoints !== null || myRank) && modelId && role === 'model' ? (
              <FadeInItem>
                <div className="dashboard-hero-center">
                  <DayOverviewCard
                    modelId={modelId}
                    points={points}
                    dailyTasks={dailyTasks}
                    dailyTaskCompletions={dailyTaskCompletions}
                    dailyTaskPenalties={dailyTaskPenalties}
                    rank={myRank > 0 ? myRank : null}
                    centered
                  />
                </div>
              </FadeInItem>
            ) : (myPoints !== null || myRank) ? (
              <FadeInItem>
                <div className="dashboard-hero-center">
                  <div className="dashboard-stats-row dashboard-stats-row--centered">
                    {myPoints !== null && (
                      <div className="dashboard-stat-pill">
                        <span className="dashboard-stat-label">ქულები</span>
                        <span className="dashboard-stat-value">★ {myPoints}</span>
                      </div>
                    )}
                    {myRank > 0 && (
                      <div className="dashboard-stat-pill">
                        <span className="dashboard-stat-label">რეიტინგი</span>
                        <span className="dashboard-stat-value">#{myRank}</span>
                      </div>
                    )}
                  </div>
                </div>
              </FadeInItem>
            ) : null}

            <FadeInItem>
              <section className="dashboard-feed-block" id="team-feed" aria-label="გუნდის ფიდი">
                <div className="dashboard-feed-head">
                  <div>
                    <h2 className="dashboard-feed-title">გუნდის ფიდი</h2>
                    <p className="dashboard-feed-desc">დაწერე პოსტი, გაუზიარე ფოტო, რეაქცია და კომენტარი</p>
                  </div>
                  <Link to="/posts" className="dashboard-feed-link">
                    სრული გვერდი <ArrowRight size={14} />
                  </Link>
                </div>

                <FeedComposer
                  user={user}
                  modelId={modelId}
                  avatar={profileAvatar}
                  authorName={authorName}
                  hideAi
                />

                <div id="team-feed-list" className="feed-list">
                  {feedPosts.length === 0 ? (
                    <div className="feed-empty">
                      <p className="feed-empty-title">ჯერ პოსტები არ არის</p>
                      <p className="feed-empty-desc">იყავი პირველი — დაწერე რამე ზემოთ!</p>
                    </div>
                  ) : (
                    feedPosts.map((post) => (
                      <FeedPostCard
                        key={post.id}
                        post={post}
                        currentUid={user?.uid}
                        currentUserName={authorName}
                        currentUserAvatar={profileAvatar}
                        onNavigateProfile={(id) => navigate(`/models/${id}`)}
                        isNew={post.id === lastNewPostId}
                      />
                    ))
                  )}
                </div>
              </section>
            </FadeInItem>

            {billboardModel && (
              <FadeInItem className="lg:hidden">
                <motion.div
                  initial={{ scale: 0.97, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="dashboard-billboard elite-panel elite-panel-glow"
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
                      კვირის ლიდერი და ოფიციალური წარმომადგენელი
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
              <div className="dashboard-section-head">
                <div className="page-eyebrow">
                  <Sparkles size={10} />
                  სწრაფი წვდომა
                </div>
                <h3 className="dashboard-section-title">სექციები</h3>
              </div>
              <div className="dashboard-actions-grid">
                {actions.map((card, i) => (
                  <motion.button
                    key={card.title}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="elite-action-card text-left w-full"
                    onClick={() => handleActionClick(card.to)}
                  >
                    <div className="elite-action-card-icon" style={{ color: card.color }}>
                      <card.icon size={22} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{card.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{card.desc}</p>
                    <ArrowRight size={14} className="mt-4 text-[var(--accent)]" />
                  </motion.button>
                ))}
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: actions.length * 0.05 }}
                  className="elite-action-card text-left w-full"
                  onClick={() => navigate('/posts')}
                >
                  <div className="elite-action-card-icon" style={{ color: 'var(--accent-bright)' }}>
                    <Newspaper size={22} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">პოსტები</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">სრული ფიდის გვერდი</p>
                  <ArrowRight size={14} className="mt-4 text-[var(--accent)]" />
                </motion.button>
              </div>
            </FadeInItem>

            <div className="lg:hidden space-y-6 mt-8">
              <FadeInItem>
                <div className="elite-panel p-5 sm:p-6">
                  <h3 className="section-title">
                    <Trophy size={18} className="text-[var(--accent)]" />
                    ტოპ რეიტინგი
                  </h3>
                  {leaderboard.length === 0 ? (
                    <div className="empty-state py-8">
                      <p className="empty-state-title text-sm">მოდელები ჯერ არ არის</p>
                    </div>
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
                <div className="elite-panel p-5 sm:p-6">
                  <h3 className="section-title">
                    <Megaphone size={18} className="text-[var(--accent)]" />
                    განცხადებები
                  </h3>
                  {announcements.length === 0 ? (
                    <div className="empty-state py-6">
                      <p className="empty-state-title text-sm">განცხადებები ცარიელია</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {announcements.slice(0, 4).map((ann) => (
                        <div
                          key={ann.id}
                          onClick={() => navigate('/announcements')}
                          className="dashboard-news-row"
                        >
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{ann.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{ann.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeInItem>

              <FadeInItem>
                <div className="elite-panel p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="page-eyebrow mb-1">
                        <Sparkles size={10} />
                        მოდელები
                      </div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">გუნდი</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/models')}
                      className="elite-chip cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      ყველა <ArrowRight size={12} />
                    </button>
                  </div>
                  {modelsList.length === 0 ? (
                    <div className="empty-state">
                      <p className="empty-state-title">მოდელები ჯერ არ არის</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {modelsList.slice(0, 6).map((model, i) => (
                        <motion.div
                          key={model.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="model-row cursor-pointer"
                          onClick={() => navigate(`/models/${model.id}`)}
                        >
                          <ModelAvatar src={model.avatar} name={model.name} size="sm" className="!rounded-xl shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{model.name}</p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">{model.tagline}</p>
                          </div>
                          <span className="elite-chip shrink-0">{points[model.id] || 0} ქ.</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeInItem>
            </div>

            {isAdminRole(role) && (
              <FadeInItem>
                <Card className="mt-8 mb-6" onClick={() => navigate('/admin')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-[var(--text-primary)]">ადმინ პანელი</h3>
                      <p className="text-sm text-[var(--text-muted)] mt-1">ანგარიშები და ქულები</p>
                    </div>
                    <ArrowRight className="text-[var(--accent)]" />
                  </div>
                </Card>
              </FadeInItem>
            )}
          </div>

          <DashboardRightRail
            billboardModel={billboardModel}
            leaderboard={leaderboard}
            announcements={announcements}
            onNavigateAnnouncements={() => navigate('/announcements')}
          />
        </div>
      </FadeInContainer>
    </PageTransition>
  )
}
