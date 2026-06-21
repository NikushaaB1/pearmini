import { useEffect, useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, Image, ArrowRight } from 'lucide-react'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import PageHeader from '../components/ui/PageHeader'
import ModelAvatar from '../components/ui/ModelAvatar'
import { SkeletonCard } from '../components/ui/Loader'
import { useUserStore } from '../store/useUserStore'
import { isAdminRole } from '../utils/roles'
import { getModelImages } from '../services/storage'

export default function UploadsOverview() {
  const navigate = useNavigate()
  const { role, models } = useUserStore()
  const [modelData, setModelData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await Promise.all(
        models.map(async (model) => {
          const images = await getModelImages(model.id, 'uploaded')
          return { model, images }
        })
      )
      setModelData(data)
      setLoading(false)
    }
    load()
  }, [models])

  if (!isAdminRole(role)) {
    const modelId = useUserStore.getState().modelId
    if (!modelId) return <Navigate to="/dashboard" replace />
    return <Navigate to={`/models/${modelId}`} replace />
  }

  const totalUploads = modelData.reduce((sum, d) => sum + d.images.length, 0)

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <PageHeader
            eyebrow="გალერეა"
            icon={Upload}
            title="ატვირთვები"
            subtitle={`სულ ${totalUploads} ფოტო — ყველა მოდელის მასალა ერთ ადგილას`}
          />
        </FadeInItem>

        <div className="space-y-8">
          {loading
            ? models.map((m) => <SkeletonCard key={m.id} className="h-40 rounded-2xl" />)
            : modelData.map(({ model, images }) => (
                <FadeInItem key={model.id}>
                  <Card hover={false}>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <ModelAvatar src={model.avatar} name={model.name} size="sm" className="!rounded-xl" />
                        <div>
                          <h3 className="font-semibold text-lg text-[var(--text-primary)]">{model.name}</h3>
                          <p className="text-sm text-[var(--text-muted)]">{images.length} ფოტო</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/models/${model.id}`)}
                        className="elite-chip cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        ნახვა <ArrowRight size={12} />
                      </button>
                    </div>
                    {images.length === 0 ? (
                      <div className="empty-state py-8">
                        <div className="empty-state-icon w-12 h-12">
                          <Upload size={20} />
                        </div>
                        <p className="empty-state-title text-sm">ცარიელია</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {images.slice(0, 16).map((img) => (
                          <div key={img.id} className="aspect-square rounded-lg overflow-hidden cursor-pointer" onClick={() => navigate(`/models/${model.id}`)}>
                            <img src={img.url} alt={img.name} loading="lazy" className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </FadeInItem>
              ))}
        </div>

        {!loading && models.length === 0 && (
          <Card hover={false} className="text-center py-16">
            <Image className="mx-auto text-[var(--text-subtle)] mb-4" size={40} />
            <p className="text-[var(--text-muted)]">მოდელები ჯერ არ არის</p>
          </Card>
        )}
      </FadeInContainer>
    </PageTransition>
  )
}
