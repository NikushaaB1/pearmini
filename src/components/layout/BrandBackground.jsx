import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../store/useThemeStore'
import brandImg from '../../assets/pear-brand.png'

export default function BrandBackground() {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
          style={{ background: 'var(--bg-app-mesh)', backgroundAttachment: 'fixed' }}
        />
      </AnimatePresence>

      {/* Ambient gold orb — top left */}
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
        animate={{
          opacity: isDark ? 0.35 : 0.25,
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(212,168,83,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Rose-gold orb — top right */}
      <motion.div
        className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full"
        animate={{
          opacity: isDark ? 0.2 : 0.15,
          scale: [1, 1.12, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        style={{
          background: 'radial-gradient(circle, rgba(183,110,121,0.14) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Bottom warm glow */}
      <motion.div
        className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full"
        animate={{ opacity: isDark ? 0.25 : 0.18 }}
        transition={{ duration: 0.8 }}
        style={{
          background: 'radial-gradient(ellipse, rgba(201,169,98,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <motion.img
        src={brandImg}
        alt=""
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
        animate={{
          opacity: isDark ? 0.07 : 0.045,
          scale: isDark ? 1.06 : 1,
        }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: 'min(65vw, 480px)', maxWidth: '90%' }}
      />
    </div>
  )
}
