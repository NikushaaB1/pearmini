import { useState } from 'react'
import { X, Phone, Link2, Sparkles, User } from 'lucide-react'
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
      await updateModelProfile(model.id, { tagline: formData.tagline.trim() || 'ელიტური მოდელი' })
      await updateModelPaymentInfo(model.id, formData.phone.trim(), formData.kisaId.trim())
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
      className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="w-full max-w-md elite-panel p-6 sm:p-7 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-hero-glow" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <Sparkles size={20} className="text-[var(--accent)]" />
            პროფილის რედაქტირება
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl relative z-10" style={{ background: 'var(--bg-hover)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--accent-soft)] text-[var(--accent)]">
            <User size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{model?.name}</p>
            <p className="text-[11px] text-[var(--text-muted)]">განაახლე შენი ინფორმაცია</p>
          </div>
        </div>

        <div className="space-y-4 relative z-10">
          <div>
            <label className="elite-input-label">მოკლე აღწერა</label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              placeholder="მაგ: ელიტური მოდელი"
              className="elite-input"
              maxLength={100}
            />
          </div>

          <div>
            <label className="elite-input-label">
              <Phone size={14} />
              ტელეფონის ნომერი
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+995 5XX XXX XXX"
              className="elite-input"
            />
          </div>

          <div>
            <label className="elite-input-label">
              <Link2 size={14} />
              Kisa.ge ID
            </label>
            <input
              type="text"
              name="kisaId"
              value={formData.kisaId}
              onChange={handleChange}
              placeholder="თქვენი Kisa ID"
              className="elite-input"
            />
            <p className="text-[11px] text-[var(--text-subtle)] mt-1.5">
              ქულების გადაცვლისთვის Kisa.ge ანგარიში
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 relative z-10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
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
