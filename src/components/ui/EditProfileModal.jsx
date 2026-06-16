import { useState } from 'react'
import { X, Phone, Link2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Button from './Button'
import { updateModelProfile, updateModelPaymentInfo } from '../../services/modelsService'

export default function EditProfileModal({ model, onClose, onSave }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tagline: model?.tagline || '',
    phone: model?.phone_number || '',
    kisaId: model?.kisa_id || '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    if (!model?.id) return

    setLoading(true)
    try {
      if (formData.tagline) {
        await updateModelProfile(model.id, { tagline: formData.tagline })
      }

      if (formData.phone || formData.kisaId) {
        await updateModelPaymentInfo(model.id, formData.phone, formData.kisaId)
      }

      toast.success('პროფილი განახლდა!')
      onSave?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'განახლება ვერ მოხერხდა')
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
            <Sparkles size={24} className="text-[var(--accent)]" />
            პროფილის რედაქტირება
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <X size={20} className="text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
              მოკლე აღწერა
            </label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              placeholder="მაგ: ელიტური მოდელი"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              maxLength="100"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <Phone size={16} />
              ტელეფონი (Kisa.ge-სთვის)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+995 5XX XXX XXX"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Kisa.ge ID */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
              <Link2 size={16} />
              Kisa.ge ID
            </label>
            <input
              type="text"
              name="kisaId"
              value={formData.kisaId}
              onChange={handleChange}
              placeholder="თქვენი Kisa ID"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Kisa.ge-ზე ქულების გამო დაა მოგება აქტივირება უზრუნველყოს თქვენი გადახდის მეთოდი.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors font-medium"
          >
            დახურვა
          </button>
          <Button
            onClick={handleSave}
            loading={loading}
            className="flex-1"
          >
            შენახვა
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
