import { useState, useEffect } from 'react'
import { useParams, Navigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Palette, Star, Mail, Sparkles, Edit3, Phone, Upload, Settings } from 'lucide-react'
import AvatarPicker from '../components/ui/AvatarPicker'
import EditProfileModal from '../components/ui/EditProfileModal'
import { changeModelAvatar } from '../services/avatarService'
import toast from 'react-hot-toast'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import UploadZone from '../components/ui/UploadZone'
import ImageViewer from '../components/ui/ImageViewer'
import BeforeAfterSlider from '../components/ui/BeforeAfterSlider'
import { SkeletonCard } from '../components/ui/Loader'
import { useUserStore } from '../store/useUserStore'
import { isAdminRole } from '../utils/roles'
import { uploadImage, getModelImages, deleteImageWithPermissions } from '../services/storage'
import { adjustModelPoints } from '../services/pointsService'
import { logActivityEntry } from '../services/activityService'
import { isUsingLocalAuth } from '../services/authService'

export default function ModelProfile() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const model = useUserStore((s) => s.models.find((m) => m.id === id))
  const { role, modelId, addPoints, logActivity } = useUserStore()
  const points = useUserStore((s) => s.points[id] || 0)

  const [uploaded, setUploaded] = useState([])
  const [edited, setEdited] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [viewerImage, setViewerImage] = useState(null)
  const [activeTab, setActiveTab] = useState('gallery')
  const [editModalOpen, setEditModalOpen] = useState(false)

  const isOwnProfile = modelId === id
  const canUpload = isAdminRole(role) || isOwnProfile
  const canEdit = isOwnProfile || isAdminRole(role)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'upload' && canUpload) setActiveTab('upload')
    if (tab === 'settings' && canEdit) {
      setEditModalOpen(true)
      setActiveTab('gallery')
    }
  }, [searchParams, canUpload, canEdit])

  useEffect(() => {
    if (!model) return
    loadImages()
  }, [id, model])

  const loadImages = async () => {
    setLoading(true)
    try {
      const [uploads, edits] = await Promise.all([
        getModelImages(id, 'uploaded'),
        getModelImages(id, 'edited'),
      ])
      setUploaded(uploads)
      setEdited(edits)
    } catch {
      toast.error('ფოტოების ჩატვირთვა ვერ მოხერხდა')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (files) => {
    setUploading(true)
    setProgress(0)
    try {
      for (let i = 0; i < files.length; i++) {
        const image = await uploadImage(files[i], id, 'uploaded', (p) => {
          setProgress(((i + p / 100) / files.length) * 100)
        })
        setUploaded((prev) => [image, ...prev])
      }
      if (role === 'model') {
        if (isUsingLocalAuth()) {
          addPoints(id, 10)
        } else {
          await adjustModelPoints(id, 10)
        }
        toast.success('+10 ქულა!')
      }
      const activityText = `${files.length} ფოტო — ${model.name}`
      if (isUsingLocalAuth()) {
        logActivity(activityText, model.name)
      } else {
        await logActivityEntry(activityText, model.name)
      }
      toast.success('ატვირთვა დასრულდა!')
    } catch {
      toast.error('ატვირთვა ვერ მოხერხდა')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDelete = async (image) => {
    await deleteImageWithPermissions(image.path, image.modelId, role, modelId)
    setUploaded((prev) => prev.filter((img) => img.id !== image.id))
    setEdited((prev) => prev.filter((img) => img.id !== image.id))
    const activityText = `ფოტო წაიშალა — ${model.name}`
    if (isUsingLocalAuth()) {
      logActivity(activityText, model.name)
    } else {
      await logActivityEntry(activityText, model.name)
    }
  }

  if (!model) return <Navigate to="/dashboard" replace />

  const tabs = [
    { id: 'gallery', label: 'გალერეა', icon: Camera, count: uploaded.length },
    { id: 'edited', label: 'რედაქტირებული', icon: Palette, count: edited.length },
    ...(canUpload ? [{ id: 'upload', label: 'ატვირთვა', icon: Upload, count: null }] : []),
    ...(canEdit ? [{ id: 'settings', label: 'პროფილი', icon: Settings, count: null }] : []),
  ]

  const handleTabClick = (tabId) => {
    if (tabId === 'settings') {
      setEditModalOpen(true)
      return
    }
    setActiveTab(tabId)
  }

  return (
    <PageTransition>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-hero mb-8 relative"
      >
        <div className="profile-hero-glow" />
        <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <AvatarPicker
            src={model.avatar}
            name={model.name}
            size="lg"
            animate
            editable={isOwnProfile}
            onUpload={(file) => changeModelAvatar(id, file)}
          />
          <div className="flex-1 min-w-0">
            <div className="page-eyebrow mb-2">
              <Sparkles size={10} />
              ელიტური მოდელი
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)]">
              {model.name}
            </h1>
            <p className="text-[var(--text-muted)] mt-1.5">{model.tagline}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[var(--text-subtle)]">
              {model.email && (
                <span className="flex items-center gap-1.5">
                  <Mail size={14} />
                  {model.email}
                </span>
              )}
              {model.phone_number && (
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-[var(--accent)]" />
                  {model.phone_number}
                </span>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[var(--accent)] border transition-all hover:bg-[var(--accent-soft)]"
                style={{ borderColor: 'rgba(196,149,106,0.35)', background: 'var(--bg-card)' }}
              >
                <Edit3 size={16} />
                პროფილის რედაქტირება
              </button>
            )}
          </div>
          <motion.div
            key={points}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="elite-panel px-6 py-4 flex flex-col items-center shrink-0"
          >
            <Star className="text-[var(--accent)] mb-1" size={20} fill="currentColor" />
            <span className="text-2xl font-bold text-[var(--text-primary)]">{points}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              ქულა
            </span>
          </motion.div>
        </div>
      </motion.div>

      <div className="elite-tabs mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`elite-tab ${activeTab === tab.id ? 'elite-tab--active' : ''}`}
          >
            <tab.icon size={15} strokeWidth={1.75} />
            {tab.label}
            {tab.count !== null && (
              <span className="text-[10px] opacity-70">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      <FadeInContainer>
        {activeTab === 'upload' && canUpload && (
          <FadeInItem>
            <div className="elite-panel p-5 sm:p-6 mb-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-[var(--text-primary)]">
                <Camera size={18} className="text-[var(--accent)]" />
                ახალი ფოტოები
              </h2>
              <UploadZone onUpload={handleUpload} uploading={uploading} progress={progress} />
            </div>
          </FadeInItem>
        )}

        {activeTab === 'gallery' && (
          <FadeInItem>
            {loading ? (
              <div className="masonry-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} className="masonry-item h-48 rounded-xl" />
                ))}
              </div>
            ) : uploaded.length === 0 ? (
              <div className="elite-panel p-12 text-center">
                <Camera className="mx-auto text-[var(--text-subtle)] mb-3" size={32} />
                <p className="text-[var(--text-muted)]">გალერეა ცარიელია</p>
                {canUpload && (
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="elite-chip mt-4 cursor-pointer"
                  >
                    ატვირთვის დაწყება
                  </button>
                )}
              </div>
            ) : (
              <div className="masonry-grid">
                {uploaded.map((img, i) => (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="masonry-item group relative rounded-xl overflow-hidden cursor-pointer border"
                    style={{ borderColor: 'var(--border-subtle)' }}
                    onClick={() => setViewerImage(img)}
                  >
                    <motion.img
                      src={img.url}
                      alt={img.name}
                      loading="lazy"
                      whileHover={{ scale: 1.04 }}
                      transition={{ duration: 0.4 }}
                      className="w-full rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end p-3 opacity-0 group-hover:opacity-100">
                      <span className="text-white text-xs truncate">{img.name}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </FadeInItem>
        )}

        {activeTab === 'edited' && (
          <FadeInItem>
            {edited.length === 0 && uploaded.length < 2 ? (
              <div className="elite-panel p-12 text-center">
                <Palette className="mx-auto text-[var(--text-subtle)] mb-3" size={32} />
                <p className="text-[var(--text-muted)]">რედაქტირებული კონტენტი მალე გამოჩნდება</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(edited.length > 0
                  ? edited.map((img) => ({
                      before: uploaded[0]?.url || img.url,
                      after: img.url,
                      label: 'რედაქტორიული',
                    }))
                  : uploaded.slice(0, 2).map((img, i) => ({
                      before: img.url,
                      after: uploaded[(i + 1) % uploaded.length]?.url || img.url,
                      label: 'რედაქტორიული',
                    }))
                ).map((item, i) => (
                  <BeforeAfterSlider key={i} before={item.before} after={item.after} label={item.label} />
                ))}
              </div>
            )}
          </FadeInItem>
        )}
      </FadeInContainer>

      <ImageViewer
        image={viewerImage}
        isOpen={!!viewerImage}
        onClose={() => setViewerImage(null)}
        showDownload={isAdminRole(role)}
        canDelete={canUpload}
        onDelete={handleDelete}
      />

      <AnimatePresence>
        {editModalOpen && canEdit && (
          <EditProfileModal
            model={model}
            onClose={() => setEditModalOpen(false)}
            onSave={() => setEditModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </PageTransition>
  )
}
