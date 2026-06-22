import { motion, AnimatePresence } from 'framer-motion'

import { useThemeStore } from '../../store/useThemeStore'

import brandImg from '../../assets/pear-brand.png'



export default function BrandBackground() {

  const theme = useThemeStore((s) => s.theme)

  const isDark = theme === 'dark'



  return (

    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none brand-bg">

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



      <div className="brand-bg-shimmer" aria-hidden />



      <motion.div

        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full"

        animate={{ opacity: isDark ? 0.38 : 0.28, scale: [1, 1.08, 1], x: [0, 12, 0] }}

        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}

        style={{

          background: 'radial-gradient(circle, rgba(181,106,130,0.28) 0%, transparent 68%)',

          filter: 'blur(56px)',

        }}

      />



      <motion.div

        className="absolute top-20 right-[-5%] w-[420px] h-[420px] rounded-full"

        animate={{ opacity: isDark ? 0.22 : 0.18, scale: [1, 1.12, 1] }}

        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 3 }}

        style={{

          background: 'radial-gradient(circle, rgba(212,168,83,0.2) 0%, transparent 70%)',

          filter: 'blur(54px)',

        }}

      />



      <motion.div

        className="absolute bottom-[-10%] left-[15%] w-[380px] h-[380px] rounded-full"

        animate={{ opacity: isDark ? 0.2 : 0.14, y: [0, -16, 0] }}

        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }}

        style={{

          background: 'radial-gradient(circle, rgba(201,149,106,0.16) 0%, transparent 72%)',

          filter: 'blur(48px)',

        }}

      />



      <motion.div

        className="absolute -bottom-44 left-1/2 -translate-x-1/2 w-[720px] h-[400px] rounded-full"

        animate={{ opacity: isDark ? 0.26 : 0.18 }}

        style={{

          background: 'radial-gradient(ellipse, rgba(74,44,61,0.16) 0%, transparent 70%)',

          filter: 'blur(64px)',

        }}

      />



      <motion.div
        className="absolute top-[42%] left-[8%] w-[280px] h-[280px] rounded-full"
        animate={{ opacity: isDark ? 0.16 : 0.12, scale: [1, 1.06, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        style={{
          background: 'radial-gradient(circle, rgba(212,168,83,0.22) 0%, transparent 68%)',
          filter: 'blur(44px)',
        }}
      />

      <motion.img

        src={brandImg}

        alt=""

        aria-hidden

        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none brand-bg-watermark"

        animate={{ opacity: isDark ? 0.07 : 0.045, scale: isDark ? 1.04 : 1 }}

        transition={{ duration: 0.8 }}

        style={{ width: 'min(58vw, 440px)', maxWidth: '88%' }}

      />

    </div>

  )

}


