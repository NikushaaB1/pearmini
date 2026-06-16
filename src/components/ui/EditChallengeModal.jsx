import { useState } from 'react'
import { X, Edit2 } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Button from './Button'

export default function EditChallengeModal({ challenge, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: challenge?.title || '',
    description: challenge?.description || '',
    pointsReward: challenge?.pointsReward || 100,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'pointsReward' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('სათაური აუცილებელია')
      return
    }

    setLoading(true)
    try {
      await onSave?.({
        id: challenge.id,
        ...formData,
      })
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'რედაქტირება ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="w-full max-w-md bg-[var(--bg-secondary)] rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-[var(--text-primary)]">
            <Edit2 size={24} className="text-[var(--accent)]" />
            გამოწვევის რედაქტირება
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              სათაური
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              maxLength="100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              აღწერა
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
              maxLength="500"
            />
          </div>

          {/* Points Reward */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              ჯილდო (ქულა)
            </label>
            <input
              type="number"
              name="pointsReward"
              value={formData.pointsReward}
              onChange={handleChange}
              min="1"
              max="10000"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors font-medium"
          >
            დახურვა
          </button>
          <Button onClick={handleSave} loading={loading} className="flex-1">
            შენახვა
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
