import { motion } from 'framer-motion'
import { Pin, Clock, Megaphone } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import { useUserStore } from '../store/useUserStore'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ka-GE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function Announcements() {
  const announcements = useUserStore((s) => s.announcements)

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <PageHeader
            eyebrow="სიახლეები"
            icon={Megaphone}
            title="განცხადებები"
            subtitle="PEAR™ Elite-ის ოფიციალური შეტყობინებები და განახლებები"
          />
        </FadeInItem>

        <div className="space-y-4 max-w-3xl mx-auto">
          {sorted.length === 0 ? (
            <div className="empty-state max-w-3xl mx-auto">
              <div className="empty-state-icon">
                <Megaphone size={24} />
              </div>
              <p className="empty-state-title">განცხადებები ცარიელია</p>
            </div>
          ) : (
            sorted.map((ann, i) => (
              <FadeInItem key={ann.id}>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card
                    hover={false}
                    className={ann.pinned ? 'card-pinned' : ''}
                    glow={ann.pinned}
                  >
                    <div className="flex items-start gap-3">
                      {ann.pinned && (
                        <div
                          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                        >
                          <Pin size={16} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg text-[var(--text-primary)]">
                            {ann.title}
                          </h3>
                          {ann.pinned && (
                            <span className="elite-chip">მიმაგრებული</span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">
                          {ann.content}
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-xs text-[var(--text-muted)]">
                          <span className="font-medium">{ann.author}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(ann.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </FadeInItem>
            ))
          )}
        </div>
      </FadeInContainer>
    </PageTransition>
  )
}
