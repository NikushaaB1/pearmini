import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { siteMaintenance } from '../../config/siteMaintenance'

export default function MaintenanceScreen() {
  const { title, subtitle, message, note } = siteMaintenance

  return (
    <div className="maintenance-screen maintenance-screen--warning min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="maintenance-warning-bg absolute inset-0" />
      <motion.div
        className="maintenance-warning-pulse absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="maintenance-warning-wrap relative z-10 w-full max-w-2xl"
      >
        <div className="maintenance-warning-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center">
          <motion.div
            className="maintenance-warning-icon mx-auto"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <AlertTriangle size={48} strokeWidth={2} />
          </motion.div>

          <div className="maintenance-warning-badge inline-flex items-center gap-2 mt-6 mb-4">
            <span className="maintenance-warning-dot" />
            <span>{subtitle}</span>
            <span className="maintenance-warning-dot" />
          </div>

          <h1 className="maintenance-warning-title text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none">
            {title}
          </h1>

          <div className="maintenance-warning-stripes my-6 sm:my-8" aria-hidden="true" />

          <p className="maintenance-warning-message text-base sm:text-lg md:text-xl font-semibold leading-relaxed">
            {message}
          </p>

          <p className="maintenance-warning-note text-sm sm:text-base mt-6 font-bold uppercase tracking-wider">
            {note}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
