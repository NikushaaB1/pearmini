import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export default function PageHeader({ eyebrow = 'PEAR™ Elite', title, subtitle, action, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="page-header glass-card p-6 sm:p-8 mb-6 sm:mb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-[1]">
        <div className="min-w-0">
          {eyebrow && (
            <div className="page-eyebrow">
              <Sparkles size={12} />
              {eyebrow}
            </div>
          )}
          <h1 className="page-title flex items-center gap-2 sm:gap-3 flex-wrap">
            {Icon && (
              <span
                className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0"
                style={{
                  background: 'var(--gradient-gold-soft)',
                  color: 'var(--accent-bright)',
                  boxShadow: 'inset 0 0 0 1px rgba(212, 168, 83, 0.2)',
                }}
              >
                <Icon size={22} strokeWidth={1.5} />
              </span>
            )}
            <span>{title}</span>
          </h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children && <div className="relative z-[1] mt-4">{children}</div>}
    </motion.div>
  )
}
