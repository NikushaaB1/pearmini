import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function PageHeader({ eyebrow = 'PEAR™ Elite', title, subtitle, action, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="page-header glass-card rounded-2xl p-6 sm:p-8 mb-8 sm:mb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <div className="page-eyebrow">
              <Sparkles size={12} />
              {eyebrow}
            </div>
          )}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </motion.div>
  )
}
