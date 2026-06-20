import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import defaultBillboard from '../../assets/pear-billboard.png'
import { parseCampaignDescription } from '../../services/shineSpotlightService'

export default function ShineWelcomeOverlay({ visible, title, subtitle, description, imageUrl, onClose }) {
  const imageSrc = imageUrl || defaultBillboard
  const { paragraphs, closingLines } = parseCampaignDescription(description || '')
  const bodyParagraphs = paragraphs.slice(1)

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          key="shine-ad-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[250] flex items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(6, 18, 8, 0.75)', backdropFilter: 'blur(6px)' }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="PEAR რეკლამა"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl shadow-2xl"
            style={{ border: '1px solid rgba(212, 168, 83, 0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="დახურვა"
              className="absolute top-2.5 right-2.5 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/90 hover:bg-black/70 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="relative h-36 sm:h-40">
              <img src={imageSrc} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0f] via-[#0a1a0f]/40 to-transparent" />
              <div className="absolute bottom-3 left-3 right-10">
                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] font-bold text-[#d4a853] mb-1">
                  <Sparkles size={10} />
                  PEAR
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#f5f0e8] leading-snug">{title}</h2>
              </div>
            </div>

            <div className="bg-[#0a1a0f] px-4 py-4 max-h-[40vh] overflow-y-auto">
              {subtitle && (
                <p className="text-sm text-[#f5f0e8]/70 leading-relaxed mb-3">{subtitle}</p>
              )}
              {bodyParagraphs.map((p, i) => (
                <p key={i} className="text-xs text-[#f5f0e8]/55 leading-relaxed mb-2 last:mb-0">
                  {p}
                </p>
              ))}
              {closingLines.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-0.5">
                  {closingLines.map((line, i) => (
                    <p
                      key={i}
                      className={`text-xs leading-relaxed ${
                        i === closingLines.length - 1 ? 'text-[#d4a853] font-semibold' : 'text-[#f5f0e8]/50'
                      }`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#0a1a0f] px-4 pb-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-[#1a1008]"
                style={{ background: 'linear-gradient(135deg, #f5d5a8, #d4a853)' }}
              >
                გასაგებია
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
