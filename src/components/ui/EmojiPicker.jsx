import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smile } from 'lucide-react'

const EMOJIS = [
  '😀', '😁', '😂', '😃', '😄', '😅', '😆', '😇', '😈', '😉',
  '😊', '😋', '😌', '😍', '😎', '😏', '😐', '😑', '😒', '😓',
  '🤣', '🤪', '🤨', '🤬', '🤮', '😜', '😝', '🤑', '🤗', '🤩',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '🔥', '💫', '⭐', '✨', '🌟', '💥', '👍', '👏', '🙌', '🤝',
  '🎉', '🎊', '🎈', '🎁', '🏆', '🎯', '💯', '✅', '❌', '⚠️',
  '😘', '😗', '😚', '😙', '🥰', '😍', '😌', '😋', '😛', '🤐',
  '🚀', '💥', '⚡', '🌈', '☀️', '😎', '👻', '🤖', '💎', '🌸',
]

export default function EmojiPicker({ onEmojiSelect }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleEmojiClick = (emoji) => {
    onEmojiSelect?.(emoji)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        title="ემოჯი დამატება"
      >
        <Smile size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute bottom-full right-0 mb-2 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-3 shadow-lg z-50 w-72"
          >
            <div className="grid grid-cols-10 gap-1">
              {EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-full aspect-square flex items-center justify-center text-2xl rounded-lg hover:bg-[var(--bg-tertiary)] hover:scale-110 transition-all"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
