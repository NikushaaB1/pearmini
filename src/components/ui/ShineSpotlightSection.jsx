import { motion } from 'framer-motion'
import { Sparkles, MapPin } from 'lucide-react'
import defaultBillboard from '../../assets/pear-billboard.png'
import { parseCampaignDescription } from '../../services/shineSpotlightService'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.1, 0.25, 1] },
  },
}

export default function ShineSpotlightSection({ title, description, imageUrl, compact = false }) {
  const imageSrc = imageUrl || defaultBillboard
  const { paragraphs, closingLines } = parseCampaignDescription(description || '')
  const leadParagraph = paragraphs[0]
  const bodyParagraphs = paragraphs.slice(1)

  return (
    <motion.section
      id="shine-spotlight"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className={`relative scroll-mt-28 ${compact ? 'mb-8' : 'mb-10'}`}
    >
      <div className="elite-panel elite-panel-glow overflow-hidden">
        <motion.div variants={itemVariants} className="p-6 sm:p-8 pb-0 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 elite-chip">
            <Sparkles size={12} />
            <span className="text-[10px] uppercase tracking-[0.25em]">PEAR კამპანია</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            {title}
          </h2>
          {leadParagraph && (
            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
              {leadParagraph}
            </p>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="relative mx-auto max-w-2xl px-6 sm:px-8 py-6 sm:py-8">
          <div
            className="absolute -inset-2 rounded-3xl pointer-events-none opacity-60"
            style={{
              background: 'radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)',
            }}
          />
          <div
            className="relative rounded-2xl overflow-hidden border"
            style={{
              borderColor: 'var(--border-medium)',
              boxShadow: 'var(--shadow-hover)',
            }}
          >
            <motion.img
              src={imageSrc}
              alt="PEAR ბანერი — ბათუმი, 26 მაისის ქუჩა"
              className="w-full h-auto object-cover"
              whileHover={{ scale: 1.015 }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="flex items-center justify-center gap-1.5 mt-3 text-xs text-[var(--text-subtle)]">
            <MapPin size={12} />
            ბათუმი, 26 მაისის ქუჩა
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="px-6 sm:px-10 pb-8 sm:pb-10 max-w-3xl mx-auto space-y-4"
        >
          {bodyParagraphs.map((para, i) => (
            <p
              key={i}
              className={`text-sm sm:text-[0.9375rem] leading-relaxed ${
                para.includes('ახლა შენი დროა') ? 'font-semibold text-[var(--accent-bright)] text-center pt-2' : 'text-[var(--text-muted)]'
              }`}
            >
              {para}
            </p>
          ))}

          {closingLines.length > 0 && (
            <div
              className="mt-8 pt-6 border-t text-center space-y-1"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {closingLines.map((line, i) => (
                <p
                  key={i}
                  className={`leading-relaxed ${
                    i === closingLines.length - 1
                      ? 'text-base sm:text-lg font-semibold text-[var(--accent-bright)]'
                      : 'text-sm text-[var(--text-muted)]'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  )
}
