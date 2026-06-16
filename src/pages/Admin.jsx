import { useState, useEffect, useRef } from 'react'

import { Navigate } from 'react-router-dom'

import { motion, AnimatePresence } from 'framer-motion'

import {
  Shield, Plus, Minus, Download, Trash2, Pin, Megaphone, Activity, Award, Image as ImageIcon, Edit2, MessageSquare
} from 'lucide-react'
import { createChallenge, rewardWinner, deleteChallenge, updateChallenge } from '../services/challengesService'
import { deleteDesign } from '../services/designsService'
import { sendSMS, getSMSHistory } from '../services/smsService'

import toast from 'react-hot-toast'

import PageTransition from '../components/animations/PageTransition'

import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'

import Card from '../components/ui/Card'

import Button from '../components/ui/Button'

import Modal from '../components/ui/Modal'

import EditChallengeModal from '../components/ui/EditChallengeModal'

import { useUserStore } from '../store/useUserStore'

import { getModelImages, downloadBulk } from '../services/storage'
import { getCVSubmissions } from '../services/cvService'

import { deleteModelFromFirestore, saveModel } from '../services/modelsService'
import { deleteAccount } from '../services/usersService'
import { adjustModelPoints, setModelPoints as saveModelPoints } from '../services/pointsService'
import {
  createAnnouncement,
  toggleAnnouncementPin,
  deleteAnnouncement as removeAnnouncement,
} from '../services/announcementsService'
import ModelAvatar from '../components/ui/ModelAvatar'

import CreateUserForm from '../components/admin/CreateUserForm'
import AdminAccountsList from '../components/admin/AdminAccountsList'
import CloudAuthBanner from '../components/admin/CloudAuthBanner'
import { isAdminRole, isHeadAdmin } from '../utils/roles'
import { isUsingLocalAuth } from '../services/authService'



export default function Admin() {

  const { role, points, addPoints, setPoints, addAnnouncement,

    togglePinAnnouncement, deleteAnnouncement, announcements, activityLog,

    models, removeModel, updateModel, challenges, designs } = useUserStore()



  const [selectedModel, setSelectedModel] = useState(models[0]?.id || '')

  const [customPoints, setCustomPoints] = useState('')

  const [annTitle, setAnnTitle] = useState('')

  const [annContent, setAnnContent] = useState('')

  const [annPinned, setAnnPinned] = useState(false)

  const [annImageUrl, setAnnImageUrl] = useState('')

  const [annImagePreview, setAnnImagePreview] = useState('')

  const [allImages, setAllImages] = useState([])

  const [showDownloadModal, setShowDownloadModal] = useState(false)

  const [activeTab, setActiveTab] = useState('users')

  const annImageInputRef = useRef(null)

  const [chalTitle, setChalTitle] = useState('')
  const [chalDesc, setChalDesc] = useState('')
  const [chalPoints, setChalPoints] = useState('100')
  const [selectedWinner, setSelectedWinner] = useState({})
  const [editingChallenge, setEditingChallenge] = useState(null)
  const [smsPhone, setSmsPhone] = useState('')
  const [smsMessage, setSmsMessage] = useState('')
  const [smsSending, setSmsSending] = useState(false)
  const [smsHistory, setSmsHistory] = useState([])
  const [cvList, setCvList] = useState([])



  useEffect(() => {

    if (models.length && !selectedModel) setSelectedModel(models[0].id)

  }, [models, selectedModel])



  useEffect(() => {

    if (!isAdminRole(role)) return

    loadAllImages()

  }, [role, models])

  useEffect(() => {
    setSmsHistory(getSMSHistory())
  }, [])

  useEffect(() => {
    setCvList(getCVSubmissions())
  }, [])


  const loadAllImages = async () => {

    const results = await Promise.all(

      models.map(async (m) => {

        const imgs = await getModelImages(m.id, 'uploaded')

        return imgs.map((img) => ({ ...img, modelName: m.name }))

      })

    )

    setAllImages(results.flat())

  }



  if (!isAdminRole(role)) {

    return <Navigate to="/dashboard" replace />

  }



  const handleAnnounceImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const url = evt.target?.result
        setAnnImageUrl(url)
        setAnnImagePreview(url)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddAnnouncement = async () => {

    if (!annTitle.trim() || !annContent.trim()) {

      toast.error('სათაური და ტექსტი აუცილებელია')

      return

    }

    try {

      if (isUsingLocalAuth()) {
        addAnnouncement({ title: annTitle, content: annContent, pinned: annPinned, imageUrl: annImageUrl })
      } else {
        await createAnnouncement({ title: annTitle.trim(), content: annContent.trim(), pinned: annPinned, imageUrl: annImageUrl })
      }

      toast.success('განცხადება გამოქვეყნდა!')

      setAnnTitle('')

      setAnnContent('')

      setAnnPinned(false)

      setAnnImageUrl('')

      setAnnImagePreview('')

    } catch {

      toast.error('განცხადების გამოქვეყნება ვერ მოხერხდა')

    }

  }



  const handleBulkDownload = async () => {

    toast.loading('ფოტოები იტვირთება...')

    await downloadBulk(allImages)

    toast.dismiss()

    toast.success(`${allImages.length} ფოტო ჩამოიტვირთა`)

    setShowDownloadModal(false)

  }



  const handleDeleteModel = async (modelId) => {

    const model = models.find((m) => m.id === modelId)

    if (!model) return

    if (!window.confirm(`წავშალოთ მოდელი "${model.name}" და მისი ანგარიში?`)) return

    try {

      const profiles = useUserStore.getState().userProfiles
      const linked = Object.values(profiles).find((p) => p.modelId === modelId)

      if (linked && isHeadAdmin(role)) {
        await deleteAccount({
          targetUid: linked.uid,
          requesterUid: useUserStore.getState().user.uid,
          requesterRole: role,
        })
      } else {
        await deleteModelFromFirestore(modelId)
      }

      removeModel(modelId)

      if (selectedModel === modelId) setSelectedModel(models.find((m) => m.id !== modelId)?.id || '')

      toast.success('მოდელი და ანგარიში წაიშალა')

    } catch (err) {

      toast.error(err.message || 'წაშლა ვერ მოხერხდა')

    }

  }



  const tabs = [

    { id: 'users', label: 'მომხმარებლები', icon: Shield },

    { id: 'announcements', label: 'განცხადებები', icon: Megaphone },

    { id: 'challenges', label: 'გამოწვევები & დიზაინი', icon: Award },

    { id: 'sms', label: 'SMS გამოგზავნა', icon: MessageSquare },
    { id: 'cvs', label: 'CVs', icon: ImageIcon },

    { id: 'images', label: 'ფოტოები', icon: Download },

    { id: 'activity', label: 'აქტივობა', icon: Activity },

  ]



  return (

    <PageTransition>

      <FadeInContainer>

        <FadeInItem>

          <div className="mb-8">

            <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">

              <Shield />

              ადმინ პანელი

            </h1>

            <p className="text-[var(--text-muted)] mt-2 text-lg">PEAR™ Elite სრული მართვის ცენტრი</p>

          </div>

        </FadeInItem>



        <FadeInItem>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">

            {tabs.map((tab) => (

              <button

                key={tab.id}

                onClick={() => setActiveTab(tab.id)}

                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${

                  activeTab === tab.id

                    ? 'nav-link-active'

                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border'

                }`}

                style={activeTab !== tab.id ? { borderColor: 'var(--border-subtle)' } : undefined}

              >

                <tab.icon size={16} />

                {tab.label}

              </button>

            ))}

          </div>

        </FadeInItem>



        {activeTab === 'users' && (

          <FadeInItem>

            <CloudAuthBanner />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              <CreateUserForm />

              <AdminAccountsList />

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <Card hover={false}>

                <h3 className="font-semibold mb-4 text-[var(--text-primary)]">მოდელების მართვა</h3>

                <div className="space-y-3">

                  {models.length === 0 && (

                    <p className="text-sm text-[var(--text-muted)] text-center py-6">მოდელები ჯერ არ არის</p>

                  )}

                  {models.map((model) => (

                    <div

                      key={model.id}

                      className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${

                        selectedModel === model.id

                          ? 'border-[var(--border-medium)]'

                          : 'border-transparent hover:bg-[var(--bg-hover)]'

                      }`}

                      style={selectedModel === model.id ? { background: 'var(--bg-hover)' } : undefined}

                    >

                      <button

                        onClick={() => setSelectedModel(model.id)}

                        className="flex items-center gap-3 flex-1 text-left"

                      >

                        <ModelAvatar src={model.avatar} name={model.name} size="xs" className="!rounded-lg" />

                        <div className="flex-1 min-w-0">

                          <p className="text-sm font-medium text-[var(--text-primary)]">{model.name}</p>

                          <p className="text-xs text-[var(--text-muted)] truncate">{model.email}</p>

                        </div>

                        <span className="text-sm font-semibold text-[var(--accent)]">

                          {points[model.id] || 0} ქულა

                        </span>

                      </button>

                      <button

                        onClick={() => handleDeleteModel(model.id)}

                        className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-hover)] transition-colors"

                        title="წაშლა"

                      >

                        <Trash2 size={14} />

                      </button>

                    </div>

                  ))}

                </div>

              </Card>



              <Card hover={false}>

                <h3 className="font-semibold mb-4 text-[var(--text-primary)]">ქულების სისტემა</h3>

                <p className="text-sm text-[var(--text-muted)] mb-4">

                  მოდელი: {models.find((m) => m.id === selectedModel)?.name || '—'}

                </p>

                <div className="flex gap-2 mb-4">

                  <Button

                    variant="secondary"

                    disabled={!selectedModel}

                    onClick={async () => {

                      try {

                        if (isUsingLocalAuth()) {
                          addPoints(selectedModel, 10)
                        } else {
                          await adjustModelPoints(selectedModel, 10)
                        }

                        toast.success('+10 ქულა')

                      } catch {

                        toast.error('ქულის განახლება ვერ მოხერხდა')

                      }

                    }}

                  >

                    <Plus size={16} /> +10

                  </Button>

                  <Button

                    variant="secondary"

                    disabled={!selectedModel}

                    onClick={async () => {

                      try {

                        if (isUsingLocalAuth()) {
                          addPoints(selectedModel, -10)
                        } else {
                          await adjustModelPoints(selectedModel, -10)
                        }

                        toast.success('-10 ქულა')

                      } catch {

                        toast.error('ქულის განახლება ვერ მოხერხდა')

                      }

                    }}

                  >

                    <Minus size={16} /> -10

                  </Button>

                </div>

                <div className="flex gap-2 mb-6">

                  <input

                    type="number"

                    value={customPoints}

                    onChange={(e) => setCustomPoints(e.target.value)}

                    placeholder="ქულის რაოდენობა"

                    className="admin-input flex-1"

                    disabled={!selectedModel}

                  />

                  <Button

                    disabled={!selectedModel}

                    onClick={async () => {

                      const val = parseInt(customPoints, 10)

                      if (isNaN(val)) return toast.error('შეიყვანე რიცხვი')

                      try {

                        if (isUsingLocalAuth()) {
                          setPoints(selectedModel, val)
                        } else {
                          await saveModelPoints(selectedModel, val)
                        }

                        toast.success(`ქულა დაყენდა: ${val}`)

                        setCustomPoints('')

                      } catch {

                        toast.error('ქულის განახლება ვერ მოხერხდა')

                      }

                    }}

                  >

                    დაყენება

                  </Button>

                </div>



                {selectedModel && (

                  <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>

                    <h4 className="text-sm font-medium text-[var(--text-primary)]">პროფილის რედაქტირება</h4>

                    <input

                      key={selectedModel}

                      defaultValue={models.find((m) => m.id === selectedModel)?.name || ''}

                      placeholder="სახელი"

                      className="admin-input"

                      onBlur={async (e) => {
                        const val = e.target.value.trim()
                        if (val) {
                          updateModel(selectedModel, { name: val })
                          const model = models.find((m) => m.id === selectedModel)
                          if (model) await saveModel({ ...model, name: val })
                          toast.success('სახელი განახლდა')
                        }
                      }}

                    />

                    <input

                      key={`${selectedModel}-tag`}

                      defaultValue={models.find((m) => m.id === selectedModel)?.tagline || ''}

                      placeholder="აღწერა"

                      className="admin-input"

                      onBlur={async (e) => {
                        const val = e.target.value.trim()
                        if (val) {
                          updateModel(selectedModel, { tagline: val })
                          const model = models.find((m) => m.id === selectedModel)
                          if (model) await saveModel({ ...model, tagline: val })
                          toast.success('აღწერა განახლდა')
                        }
                      }}

                    />

                  </div>

                )}

              </Card>

            </div>

          </FadeInItem>

        )}



        {activeTab === 'announcements' && (

          <FadeInItem>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <Card hover={false}>

                <h3 className="font-semibold mb-4 text-[var(--text-primary)]">განცხადების შექმნა</h3>

                <div className="space-y-4">

                  <input

                    value={annTitle}

                    onChange={(e) => setAnnTitle(e.target.value)}

                    placeholder="სათაური"

                    className="admin-input"

                  />

                  <textarea

                    value={annContent}

                    onChange={(e) => setAnnContent(e.target.value)}

                    placeholder="ტექსტი"

                    rows={4}

                    className="admin-input resize-none"

                  />

                  <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">

                    <input

                      type="checkbox"

                      checked={annPinned}

                      onChange={(e) => setAnnPinned(e.target.checked)}

                      className="rounded"

                    />

                    განცხადების მიმაგრება

                  </label>

                  <div className="space-y-2">

                    <label className="text-xs text-[var(--text-muted)] font-medium block">ფოტო (არასავალდებულო)</label>

                    <input

                      type="file"

                      accept="image/*"

                      ref={annImageInputRef}

                      onChange={handleAnnounceImageChange}

                      className="hidden"

                    />

                    {annImagePreview ? (

                      <div className="relative rounded-lg overflow-hidden border aspect-video group" style={{ borderColor: 'var(--border-subtle)' }}>

                        <img src={annImagePreview} alt="Preview" className="w-full h-full object-cover" />

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">

                          <Button type="button" size="xs" variant="secondary" onClick={() => annImageInputRef.current?.click()}>

                            ფოტოს შეცვლა

                          </Button>

                        </div>

                      </div>

                    ) : (

                      <button

                        type="button"

                        onClick={() => annImageInputRef.current?.click()}

                        className="w-full p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 hover:bg-[var(--bg-hover)] transition-colors"

                        style={{ borderColor: 'var(--border-subtle)' }}

                      >

                        <ImageIcon size={20} className="text-[var(--text-muted)]" />

                        <span className="text-xs text-[var(--text-muted)]">ფოტოს ატვირთვა</span>

                      </button>

                    )}

                  </div>

                  <Button onClick={handleAddAnnouncement} className="w-full">

                    <Megaphone size={16} /> გამოქვეყნება

                  </Button>

                </div>

              </Card>



              <Card hover={false}>

                <h3 className="font-semibold mb-4 text-[var(--text-primary)]">პოსტების მართვა</h3>

                <div className="space-y-3 max-h-96 overflow-y-auto">

                  {announcements.map((ann) => (

                    <div key={ann.id} className="flex items-start gap-3 p-3 rounded-xl glass">

                      <div className="flex-1">

                        <p className="text-sm font-medium text-[var(--text-primary)]">{ann.title}</p>

                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">

                          {ann.content}

                        </p>

                      </div>

                      <div className="flex gap-1">

                        <button

                          onClick={async () => {

                            try {

                              if (isUsingLocalAuth()) {
                                togglePinAnnouncement(ann.id)
                              } else {
                                await toggleAnnouncementPin(ann.id, !ann.pinned)
                              }

                              toast.success(ann.pinned ? 'მოხსნილია' : 'მიმაგრებულია')

                            } catch {

                              toast.error('განახლება ვერ მოხერხდა')

                            }

                          }}

                          className={`p-1.5 rounded-lg hover:bg-[var(--bg-hover)] ${

                            ann.pinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'

                          }`}

                        >

                          <Pin size={14} />

                        </button>

                        <button

                          onClick={async () => {

                            try {

                              if (isUsingLocalAuth()) {
                                deleteAnnouncement(ann.id)
                              } else {
                                await removeAnnouncement(ann.id)
                              }

                              toast.success('წაიშალა')

                            } catch {

                              toast.error('წაშლა ვერ მოხერხდა')

                            }

                          }}

                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"

                        >

                          <Trash2 size={14} />

                        </button>

                      </div>

                    </div>

                  ))}

                </div>

              </Card>

            </div>

          </FadeInItem>

        )}



        {activeTab === 'images' && (

          <FadeInItem>

            <Card hover={false}>

              <div className="flex items-center justify-between mb-4">

                <h3 className="font-semibold text-[var(--text-primary)]">ყველა ფოტო ({allImages.length})</h3>

                <Button onClick={() => setShowDownloadModal(true)} disabled={allImages.length === 0}>

                  <Download size={16} /> ყველას ჩამოტვირთვა

                </Button>

              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">

                {allImages.map((img) => (

                  <div key={img.id} className="aspect-square rounded-lg overflow-hidden group relative">

                    <img src={img.url} alt={img.name} loading="lazy" className="w-full h-full object-cover" />

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">

                      <p className="text-[8px] text-white truncate">{img.modelName}</p>

                    </div>

                  </div>

                ))}

              </div>

            </Card>

          </FadeInItem>

        )}

        {activeTab === 'challenges' && (
          <FadeInItem>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card hover={false}>
                <h3 className="font-semibold mb-4 text-[var(--text-primary)] text-md">გამოწვევის შექმნა</h3>
                <div className="space-y-4">
                  <input
                    value={chalTitle}
                    onChange={(e) => setChalTitle(e.target.value)}
                    placeholder="გამოწვევის სათაური"
                    className="admin-input"
                  />
                  <textarea
                    value={chalDesc}
                    onChange={(e) => setChalDesc(e.target.value)}
                    placeholder="დეტალური აღწერა"
                    rows={4}
                    className="admin-input resize-none"
                  />
                  <input
                    type="number"
                    value={chalPoints}
                    onChange={(e) => setChalPoints(e.target.value)}
                    placeholder="ჯილდო ქულები (მაგ: 200)"
                    className="admin-input"
                  />
                  <Button
                    onClick={async () => {
                      if (!chalTitle.trim() || !chalDesc.trim() || !chalPoints) {
                        return toast.error('შეავსეთ ყველა ველი')
                      }
                      try {
                        await createChallenge({
                          title: chalTitle,
                          description: chalDesc,
                          pointsReward: parseInt(chalPoints, 10),
                        })
                        toast.success('გამოწვევა წარმატებით შეიქმნა!')
                        setChalTitle('')
                        setChalDesc('')
                        setChalPoints('100')
                      } catch (err) {
                        console.error('Challenge creation error:', err)
                        toast.error('გამოწვევის შექმნა ვერ მოხერხდა: ' + (err?.message || 'უცნობი შეცდომა'))
                      }
                    }}
                    className="w-full"
                  >
                    <Plus size={16} /> გამოწვევის შექმნა
                  </Button>
                </div>
              </Card>

              <Card hover={false}>
                <h3 className="font-semibold mb-4 text-[var(--text-primary)] text-md">აქტიური გამოწვევები</h3>
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {challenges.filter((c) => c.status === 'active').length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] text-center py-6">აქტიური გამოწვევები არ არის</p>
                  )}
                  {challenges
                    .filter((c) => c.status === 'active')
                    .map((chal) => (
                      <div key={chal.id} className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{chal.title}</p>
                          <p className="text-[11px] text-[var(--text-muted)] mt-1">{chal.description}</p>
                          <p className="text-[10px] text-[var(--accent)] font-bold mt-1.5">ჯილდო: {chal.pointsReward} ქულა</p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <select
                            value={selectedWinner[chal.id] || ''}
                            onChange={(e) => setSelectedWinner({ ...selectedWinner, [chal.id]: e.target.value })}
                            className="admin-input text-xs py-1.5 flex-1"
                          >
                            <option value="">აირჩიე გამარჯვებული...</option>
                            {models.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          <Button
                            disabled={!selectedWinner[chal.id]}
                            onClick={async () => {
                              try {
                                await rewardWinner(chal.id, selectedWinner[chal.id])
                                toast.success('გამარჯვებული დაჯილდოვდა!')
                              } catch (err) {
                                toast.error(err.message || 'დაჯილდოება ვერ მოხერხდა')
                              }
                            }}
                            size="sm"
                          >
                            მინიჭება
                          </Button>
                          <button
                            onClick={() => setEditingChallenge(chal)}
                            className="p-2 rounded-lg hover:bg-amber-500/10 text-amber-600 transition-colors"
                            title="რედაქტირება"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('წავშალოთ ეს გამოწვევა?')) {
                                try {
                                  await deleteChallenge(chal.id)
                                  toast.success('წაიშალა')
                                } catch {
                                  toast.error('წაშლა ვერ მოხერხდა')
                                }
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card hover={false}>
                <h3 className="font-semibold mb-4 text-[var(--text-primary)] text-md">დასრულებული გამოწვევები</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {challenges.filter((c) => c.status === 'completed').length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] text-center py-6">დასრულებული გამოწვევები არ არის</p>
                  )}
                  {challenges
                    .filter((c) => c.status === 'completed')
                    .map((chal) => {
                      const winnerModel = models.find((m) => m.id === chal.winnerId)
                      return (
                        <div key={chal.id} className="p-3 rounded-xl border flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}>
                          <div>
                            <p className="text-xs font-semibold text-[var(--text-primary)]">{chal.title}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                              გამარჯვებული: <span className="font-bold text-[var(--accent)]">{winnerModel?.name || chal.winnerId}</span>
                            </p>
                          </div>
                          <span className="text-xs font-bold text-[var(--text-subtle)]">+{chal.pointsReward} ქ.</span>
                        </div>
                      )
                    })}
                </div>
              </Card>

              <Card hover={false}>
                <h3 className="font-semibold mb-4 text-[var(--text-primary)] text-md">ატვირთული დიზაინები ({designs.length})</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {designs.length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] text-center py-6">ატვირთული დიზაინები არ არის</p>
                  )}
                  {designs.map((design) => (
                    <div key={design.id} className="p-3 rounded-xl border flex items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center gap-3">
                        <img src={design.imageUrl} alt={design.title} className="w-12 h-12 object-cover rounded-lg border" />
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{design.title}</p>
                          <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{design.description}</p>
                          <p className="text-[9px] text-[var(--accent)] font-medium mt-0.5 font-semibold">ავტორი: {design.senderName} (+50 ქ.)</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          if (window.confirm('დარწმუნებული ხართ, რომ გსურთ ამ დიზაინის წაშლა?')) {
                            try {
                              await deleteDesign(design.id, design.modelId)
                              toast.success('დიზაინი წაიშალა')
                            } catch {
                              toast.error('წაშლა ვერ მოხერხდა')
                            }
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </FadeInItem>
        )}

        {activeTab === 'sms' && (
          <FadeInItem>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SMS Form */}
              <Card hover={false}>
                <h3 className="font-semibold mb-4 text-[var(--text-primary)] text-md flex items-center gap-2">
                  <MessageSquare size={18} className="text-[var(--accent)]" />
                  SMS გამოგზავნა
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!smsPhone.trim() || !smsMessage.trim()) {
                      toast.error('ტელეფონი და შეტყობინება აუცილებელია')
                      return
                    }
                    setSmsSending(true)
                    try {
                      await sendSMS(smsPhone, smsMessage, 'მოდელი')
                      toast.success('SMS გაგზავნილია!')
                      setSmsPhone('')
                      setSmsMessage('')
                      setSmsHistory(getSMSHistory())
                    } catch (err) {
                      toast.error(err.message || 'გაგზავნა ვერ მოხერხდა')
                    } finally {
                      setSmsSending(false)
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-[var(--text-muted)] mb-2 block">
                      მოდელის ტელეფონი
                    </label>
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      placeholder="+995 5XX XXX XXX"
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[var(--text-muted)] mb-2 block">
                      შეტყობინება
                    </label>
                    <textarea
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="დაწერე SMS ტექსტი..."
                      rows={5}
                      className="admin-input resize-none"
                      maxLength="160"
                    />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      {smsMessage.length}/160 სიმბოლო
                    </p>
                  </div>

                  <Button
                    type="submit"
                    loading={smsSending}
                    disabled={!smsPhone.trim() || !smsMessage.trim()}
                  >
                    <MessageSquare size={16} className="mr-2" />
                    გამოგზავნა
                  </Button>
                </form>
              </Card>

              {/* SMS History */}
              <Card hover={false}>
                <h3 className="font-semibold mb-4 text-[var(--text-primary)] text-md">
                  SMS ისტორია ({smsHistory.length})
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {smsHistory.length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] text-center py-6">
                      SMS მესიჯები ჩანს აქ
                    </p>
                  )}
                  {smsHistory.map((sms) => (
                    <div
                      key={sms.id}
                      className="p-3 rounded-lg border"
                      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-primary)]">
                            {sms.phoneNumber}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {new Date(sms.sentAt).toLocaleString('ka-GE')}
                          </p>
                        </div>
                        <span
                          className="text-[9px] px-2 py-1 rounded font-semibold"
                          style={{
                            background: sms.status === 'sent' ? 'var(--accent-soft)' : 'rgba(255,0,0,0.1)',
                            color: sms.status === 'sent' ? 'var(--accent)' : '#ef4444',
                          }}
                        >
                          {sms.status === 'sent' ? '✓ გაგზავნილი' : '✕ შეცდომა'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                        {sms.message}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </FadeInItem>
        )}

        {activeTab === 'activity' && (

          <FadeInItem>

            <Card hover={false}>

              <h3 className="font-semibold mb-4 flex items-center gap-2 text-[var(--text-primary)]">

                <Activity size={18} className="text-[var(--accent)]" />

                აქტივობის ქრონოლოგია

              </h3>

              <div className="relative">

                <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: 'var(--border-subtle)' }} />

                <div className="space-y-4">

                  {activityLog.map((entry, i) => (

                    <motion.div

                      key={entry.id}

                      initial={{ opacity: 0, x: -20 }}

                      animate={{ opacity: 1, x: 0 }}

                      transition={{ delay: i * 0.05 }}

                      className="flex gap-4 pl-8 relative"

                    >

                      <div

                        className="absolute left-2.5 w-3 h-3 rounded-full border-2"

                        style={{ background: 'var(--accent)', borderColor: 'var(--bg-card-solid)' }}

                      />

                      <div className="flex-1 p-3 rounded-xl" style={{ background: 'var(--bg-hover)' }}>

                        <p className="text-sm text-[var(--text-primary)]">{entry.action}</p>

                        <p className="text-xs text-[var(--text-muted)] mt-1">

                          {entry.user} · {new Date(entry.timestamp).toLocaleString()}

                        </p>

                      </div>

                    </motion.div>

                  ))}

                </div>

              </div>

            </Card>

          </FadeInItem>

        )}

        {activeTab === 'cvs' && (
          <FadeInItem>
            <Card hover={false}>
              <h3 className="font-semibold mb-4 text-[var(--text-primary)] text-md">სატვირთო CV-ები ({cvList.length})</h3>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
                {cvList.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-6">CV შეტყობინებები არაა</p>
                )}
                {cvList.map((cv) => (
                  <div key={cv.id} className="p-3 rounded-lg border flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-hover)' }}>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{cv.name || cv.email}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{cv.message || '(no message)'}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{new Date(cv.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      {cv.fileUrl || cv.fileName ? (
                        <a href={cv.fileUrl || '#'} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/10 text-[var(--accent)]">ჩანახვა / ჩამოტვირთვა</a>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">ფაილი არ არის</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </FadeInItem>
        )}

      </FadeInContainer>



      <Modal

        isOpen={showDownloadModal}

        onClose={() => setShowDownloadModal(false)}

        title="ყველას ჩამოტვირთვა"

      >

        <p className="text-sm text-[var(--text-muted)] mb-4">

          ჩამოვტვირთოთ ყველა {allImages.length} ფოტო ყველა მოდელისგან?

        </p>

        <div className="flex gap-3">

          <Button variant="secondary" onClick={() => setShowDownloadModal(false)} className="flex-1">

            გაუქმება

          </Button>

          <Button onClick={handleBulkDownload} className="flex-1">

            <Download size={16} /> ყველას ჩამოტვირთვა

          </Button>

        </div>

      </Modal>

      <AnimatePresence>
        {editingChallenge && (
          <EditChallengeModal
            challenge={editingChallenge}
            onClose={() => setEditingChallenge(null)}
            onSave={async (updatedChallenge) => {
              try {
                await updateChallenge(updatedChallenge)
                toast.success('გამოწვევა განახლდა!')
                setEditingChallenge(null)
              } catch (err) {
                toast.error(err.message || 'განახლება ვერ მოხერხდა')
              }
            }}
          />
        )}
      </AnimatePresence>

    </PageTransition>

  )

}

