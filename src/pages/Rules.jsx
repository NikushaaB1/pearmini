import { motion } from 'framer-motion'
import { Clock, ScrollText } from 'lucide-react'
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

export default function Rules() {
  const rules = useUserStore((s) => s.rules)

  const sorted = [...rules].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return new Date(a.createdAt) - new Date(b.createdAt)
  })

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <PageHeader
            eyebrow="PEAR™ Elite"
            icon={ScrollText}
            title="წესები"
            subtitle="პლატფორმის წესები და პირობები — ყველა წევრისთვის"
          />
        </FadeInItem>

        <div className="space-y-4 max-w-3xl mx-auto">
          {sorted.length === 0 ? (
            <div className="empty-state max-w-3xl mx-auto">
              <div className="empty-state-icon">
                <ScrollText size={24} />
              </div>
              <p className="empty-state-title">წესები ჯერ არ არის დამატებული</p>
            </div>
          ) : (
            sorted.map((rule, i) => (
              <FadeInItem key={rule.id}>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card hover={false}>
                    <div className="flex items-start gap-4">
                      <div
                        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 font-semibold text-sm"
                        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-[var(--text-primary)]">
                          {rule.title}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed whitespace-pre-wrap">
                          {rule.content}
                        </p>
                        <div className="flex items-center gap-4 mt-4 text-xs text-[var(--text-muted)]">
                          <span className="font-medium">{rule.author}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(rule.createdAt)}
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
