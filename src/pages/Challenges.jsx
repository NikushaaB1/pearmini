import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Award, Sparkles, Upload, Image as ImageIcon, Send, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ModelAvatar from '../components/ui/ModelAvatar'
import { useUserStore } from '../store/useUserStore'
import { submitDesign } from '../services/designsService'

export default function Challenges() {
  const { user, role, modelId, challenges, designs, models } = useUserStore()
  
  const [activeTab, setActiveTab] = useState('challenges')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const isModel = role === 'model'

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleSubmitDesign = async (e) => {
    e.preventDefault()
    if (!title.trim() || !selectedFile || !modelId) {
      return toast.error('შეავსეთ სათაური და აირჩიეთ ფოტო')
    }

    setUploading(true)
    const toastId = toast.loading('დიზაინი იტვირთება...')
    try {
      await submitDesign({
        title,
        description,
        file: selectedFile,
        modelId,
        senderName: user.displayName || user.email,
      })
      toast.success('დიზაინი წარმატებით აიტვირთა! +50 ქულა დაგეწერათ 🎉', { id: toastId })
      setTitle('')
      setDescription('')
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err) {
      toast.error('ატვირთვა ვერ მოხერხდა: ' + (err.message || ''), { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[var(--accent)] text-xs uppercase tracking-[0.2em] mb-2">
                <Sparkles size={12} />
                გამოწვევები
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
                <Trophy size={30} strokeWidth={1.5} className="text-[var(--accent)]" />
                გამოწვევები & დიზაინი
              </h1>
              <p className="text-[var(--text-muted)] mt-1.5">გამოავლინე შენი კრეატიულობა და დააგროვე ქულები</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('challenges')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'challenges'
                    ? 'nav-link-active'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                გამოწვევები
              </button>
              <button
                onClick={() => setActiveTab('designs')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'designs'
                    ? 'nav-link-active'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                დიზაინები ({designs.length})
              </button>
            </div>
          </div>
        </FadeInItem>

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            {/* Active Challenges */}
            <FadeInItem>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <Clock size={18} className="text-[var(--accent)]" /> აქტიური გამოწვევები
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {challenges.filter((c) => c.status === 'active').length === 0 && (
                  <div className="col-span-full py-12 text-center border rounded-2xl" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-sm text-[var(--text-muted)]">აქტიური გამოწვევები ამჟამად არ არის</p>
                  </div>
                )}
                {challenges
                  .filter((c) => c.status === 'active')
                  .map((chal) => (
                    <motion.div key={chal.id} whileHover={{ y: -4 }}>
                      <Card className="h-full flex flex-col justify-between border-t-2" style={{ borderTopColor: 'var(--accent)' }}>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-full">
                              კვირის გამოწვევა
                            </span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              🏆 {chal.pointsReward} ქ.
                            </span>
                          </div>
                          <h3 className="font-semibold text-md text-[var(--text-primary)] mt-3">{chal.title}</h3>
                          <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">{chal.description}</p>
                        </div>
                        <div className="mt-5 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                          <span className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1">
                            <Clock size={11} /> აქტიურია
                          </span>
                          {isModel && (
                            <Button size="xs" onClick={() => setActiveTab('designs')}>
                              დიზაინის ატვირთვა
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </FadeInItem>

            {/* Completed Challenges */}
            <FadeInItem>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <CheckCircle size={18} className="text-emerald-500" /> დასრულებული გამოწვევები
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {challenges.filter((c) => c.status === 'completed').length === 0 && (
                  <div className="col-span-full py-8 text-center border border-dashed rounded-2xl" style={{ borderColor: 'var(--border-subtle)' }}>
                    <p className="text-xs text-[var(--text-muted)]">დასრულებული გამოწვევები არ არის</p>
                  </div>
                )}
                {challenges
                  .filter((c) => c.status === 'completed')
                  .map((chal) => {
                    const winnerModel = models.find((m) => m.id === chal.winnerId)
                    return (
                      <Card key={chal.id} hover={false} className="flex flex-col justify-between border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              დასრულებული
                            </span>
                            <h3 className="font-semibold text-sm text-[var(--text-primary)] mt-2">{chal.title}</h3>
                            <p className="text-xs text-[var(--text-muted)] mt-1">{chal.description}</p>
                          </div>
                          <span className="text-sm font-extrabold text-[var(--text-primary)] shrink-0">+{chal.pointsReward} ქ.</span>
                        </div>
                        <div className="mt-4 pt-3 border-t flex items-center gap-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                          <ModelAvatar src={winnerModel?.avatar} name={winnerModel?.name || chal.winnerId} size="xs" className="!rounded-lg" />
                          <div>
                            <p className="text-[10px] text-[var(--text-subtle)] font-medium">გამარჯვებული</p>
                            <p className="text-xs font-bold text-[var(--text-primary)]">{winnerModel?.name || chal.winnerId}</p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
              </div>
            </FadeInItem>
          </div>
        )}

        {activeTab === 'designs' && (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
            {/* Left: Design Submission Form */}
            {isModel && (
              <div className="lg:col-span-4">
                <FadeInItem>
                  <Card hover={false} className="sticky top-20 border shadow-md" style={{ borderColor: 'var(--border-subtle)' }}>
                    <h3 className="font-semibold text-md text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <Upload size={18} className="text-[var(--accent)]" /> დიზაინის ატვირთვა
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                      ატვირთე შენი ნამუშევარი, დიზაინი ან კრეატიული ფოტო და ავტომატურად მიიღე <span className="font-bold text-[var(--accent)]">+50 ქულა</span> ლიდერბორდში.
                    </p>

                    <form onSubmit={handleSubmitDesign} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs text-[var(--text-muted)] font-medium">დიზაინის სათაური:</label>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="მაგ: PEAR Elite კრეატიული კონცეპტი"
                          className="admin-input"
                          disabled={uploading}
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-[var(--text-muted)] font-medium">აღწერა (არასავალდებულო):</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="მოკლედ აღწერე შენი ნამუშევარი..."
                          rows={3}
                          className="admin-input resize-none"
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-[var(--text-muted)] font-medium block">დიზაინის ფოტო:</label>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {previewUrl ? (
                          <div className="relative rounded-2xl overflow-hidden border aspect-video group" style={{ borderColor: 'var(--border-subtle)' }}>
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button type="button" size="xs" variant="secondary" onClick={handleUploadClick} disabled={uploading}>
                                სურათის შეცვლა
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className="w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-[var(--bg-hover)] transition-all"
                            style={{ borderColor: 'var(--border-subtle)' }}
                          >
                            <ImageIcon size={24} className="text-[var(--text-subtle)]" />
                            <span className="text-xs font-semibold text-[var(--text-muted)]">აირჩიე ფაილი</span>
                            <span className="text-[10px] text-[var(--text-subtle)]">PNG, JPG, WEBP (Max 5MB)</span>
                          </button>
                        )}
                      </div>

                      <Button type="submit" disabled={uploading} className="w-full mt-2">
                        <Send size={14} /> {uploading ? 'იტვირთება...' : 'გაგზავნა & ქულების მიღება'}
                      </Button>
                    </form>
                  </Card>
                </FadeInItem>
              </div>
            )}

            {/* Right: Design Gallery Grid */}
            <div className={isModel ? 'lg:col-span-6' : 'col-span-full'}>
              <FadeInItem>
                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <ImageIcon size={18} className="text-[var(--accent)]" /> დიზაინების გალერეა
                </h3>
                {designs.length === 0 ? (
                  <div className="py-16 text-center border rounded-2xl" style={{ borderColor: 'var(--border-subtle)' }}>
                    <ImageIcon size={32} className="text-[var(--text-subtle)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-muted)]">დიზაინები ჯერ არ ატვირთულა</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatePresence>
                      {designs.map((design) => {
                        const creator = models.find((m) => m.id === design.modelId)
                        return (
                          <motion.div
                            key={design.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="rounded-2xl overflow-hidden border shadow-sm flex flex-col"
                            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card-solid)' }}
                          >
                            <div className="aspect-square relative overflow-hidden group">
                              <img src={design.imageUrl} alt={design.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute top-2.5 right-2.5 bg-black/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                                <Award size={10} className="text-[var(--accent)]" /> +50 ქ.
                              </div>
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between gap-3">
                              <div>
                                <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-1">{design.title}</h4>
                                <p className="text-[10px] text-[var(--text-muted)] mt-1 line-clamp-2 leading-normal">{design.description}</p>
                              </div>
                              <div className="pt-2.5 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
                                <ModelAvatar src={creator?.avatar} name={design.senderName} size="xs" className="!rounded-md !w-6 !h-6" />
                                <span className="text-[10px] font-medium text-[var(--text-muted)] truncate">{design.senderName}</span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </FadeInItem>
            </div>
          </div>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
