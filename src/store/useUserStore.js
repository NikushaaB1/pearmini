import { create } from 'zustand'

export function buildLeaderboard(models, points) {
  return models
    .map((model) => ({
      ...model,
      points: points[model.id] || 0,
    }))
    .sort((a, b) => b.points - a.points)
}

export function slugifyModelId(name, email) {
  const fromEmail = (email?.split('@')[0] || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
  const fromName = (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24)
  return fromName || fromEmail || `model_${Date.now()}`
}

export const useUserStore = create((set, get) => ({
  user: null,
  role: null,
  modelId: null,
  userAvatar: null,
  userProfiles: {},
  profilesLoaded: false,
  showSplash: false,
  models: [],
  points: {},
  announcements: [],
  activityLog: [],
  editedPhotos: {},
  ideas: [],
  designs: [],
  challenges: [],
  dailyTasks: [],
  dailyTaskCompletions: [],
  feedPosts: [],
  lastNewPostId: null,
  billboardModelId: null,

  setUser: (user, role, modelId) =>
    set({ user, role, modelId, userAvatar: user?.avatar || null }),
  setUserAvatar: (avatar) => set({ userAvatar: avatar }),
  setUserProfiles: (userProfiles) => set({ userProfiles, profilesLoaded: true }),
  clearUser: () =>
    set({ user: null, role: null, modelId: null, userAvatar: null, userProfiles: {}, profilesLoaded: false }),
  triggerSplash: () => set({ showSplash: true }),
  dismissSplash: () => set({ showSplash: false }),

  getModels: () => get().models,
  getModelById: (id) => get().models.find((m) => m.id === id),

  resolveModel: (id) => get().models.find((m) => m.id === id) ?? null,

  ensureModelFromProfile: (profile) => {
    if (!profile?.modelId) return null
    const existing = get().models.find((m) => m.id === profile.modelId)
    if (existing) return existing
    const model = {
      id: profile.modelId,
      name: profile.displayName || profile.email?.split('@')[0] || profile.modelId,
      email: profile.email?.toLowerCase() || '',
      tagline: 'ელიტური მოდელი',
      avatar: null,
    }
    set((state) => ({
      models: [...state.models, model],
      points: { ...state.points, [model.id]: state.points[model.id] ?? 0 },
    }))
    return model
  },

  syncModels: (remoteModels) => {
    if (!remoteModels) return
    set((state) => {
      const remoteIds = new Set(remoteModels.map((m) => m.id))
      const points = { ...state.points }
      const editedPhotos = { ...state.editedPhotos }
      for (const id of Object.keys(points)) {
        if (!remoteIds.has(id)) delete points[id]
      }
      for (const id of Object.keys(editedPhotos)) {
        if (!remoteIds.has(id)) delete editedPhotos[id]
      }
      for (const remote of remoteModels) {
        points[remote.id] = points[remote.id] ?? 0
      }
      return { models: remoteModels, points, editedPhotos }
    })
  },

  syncPoints: (remotePoints) => {
    if (!remotePoints) return
    set({ points: { ...remotePoints } })
  },

  syncAnnouncements: (remoteAnnouncements) => {
    if (!remoteAnnouncements) return
    set({ announcements: remoteAnnouncements })
  },

  syncActivityLog: (remoteLog) => {
    if (!remoteLog) return
    set({ activityLog: remoteLog })
  },

  addModel: (model) => {
    const exists = get().models.some((m) => m.id === model.id || m.email === model.email)
    if (exists) {
      set((state) => ({
        models: state.models.map((m) =>
          m.id === model.id || m.email === model.email ? { ...m, ...model } : m
        ),
      }))
      return get().getModelById(model.id) || model
    }
    set((state) => ({
      models: [...state.models, model],
      points: { ...state.points, [model.id]: state.points[model.id] ?? 0 },
    }))
    return model
  },

  updateModel: (id, updates) =>
    set((state) => ({
      models: state.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  removeModel: (id) =>
    set((state) => {
      const { [id]: _, ...restPoints } = state.points
      const { [id]: __, ...restPhotos } = state.editedPhotos
      return {
        models: state.models.filter((m) => m.id !== id),
        points: restPoints,
        editedPhotos: restPhotos,
      }
    }),

  addPoints: (modelId, amount) => {
    const current = get().points[modelId] || 0
    const newPoints = Math.max(0, current + amount)
    const modelName = get().getModelById(modelId)?.name || modelId
    set((state) => ({
      points: { ...state.points, [modelId]: newPoints },
      activityLog: [
        {
          id: Date.now().toString(),
          action: `${amount > 0 ? '+' : ''}${amount} ქულა — ${modelName}`,
          user: 'ადმინი',
          timestamp: new Date().toISOString(),
        },
        ...state.activityLog,
      ],
    }))
    return newPoints
  },

  setPoints: (modelId, value) => {
    const modelName = get().getModelById(modelId)?.name || modelId
    set((state) => ({
      points: { ...state.points, [modelId]: Math.max(0, value) },
      activityLog: [
        {
          id: Date.now().toString(),
          action: `ქულა დაყენდა ${modelName}-სთვის: ${value}`,
          user: 'ადმინი',
          timestamp: new Date().toISOString(),
        },
        ...state.activityLog,
      ],
    }))
  },

  getLeaderboard: () => buildLeaderboard(get().models, get().points),

  addAnnouncement: (announcement) =>
    set((state) => ({
      announcements: [
        {
          ...announcement,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          author: 'ადმინისტრატორი',
        },
        ...state.announcements,
      ],
      activityLog: [
        {
          id: Date.now().toString(),
          action: `განცხადება: ${announcement.title}`,
          user: 'ადმინი',
          timestamp: new Date().toISOString(),
        },
        ...state.activityLog,
      ],
    })),

  togglePinAnnouncement: (id) =>
    set((state) => ({
      announcements: state.announcements.map((a) =>
        a.id === id ? { ...a, pinned: !a.pinned } : a
      ),
    })),

  deleteAnnouncement: (id) =>
    set((state) => ({
      announcements: state.announcements.filter((a) => a.id !== id),
    })),

  logActivity: (action, user = 'სისტემა') =>
    set((state) => ({
      activityLog: [
        {
          id: Date.now().toString(),
          action,
          user,
          timestamp: new Date().toISOString(),
        },
        ...state.activityLog,
      ],
    })),

  addEditedPhoto: (modelId, photo) =>
    set((state) => ({
      editedPhotos: {
        ...state.editedPhotos,
        [modelId]: [...(state.editedPhotos[modelId] || []), photo],
      },
    })),

  syncIdeas: (remoteIdeas) => set({ ideas: remoteIdeas || [] }),
  syncDesigns: (remoteDesigns) => set({ designs: remoteDesigns || [] }),
  syncChallenges: (remoteChallenges) => set({ challenges: remoteChallenges || [] }),
  syncDailyTasks: (remoteTasks) => set({ dailyTasks: remoteTasks || [] }),
  syncDailyTaskCompletions: (remoteCompletions) =>
    set({ dailyTaskCompletions: remoteCompletions || [] }),
  syncDailyTaskPenalties: (remotePenalties) =>
    set({ dailyTaskPenalties: remotePenalties || [] }),
  syncFeedPosts: (remotePosts) => set({ feedPosts: remotePosts || [] }),
  prependFeedPost: (post) =>
    set((state) => ({
      feedPosts: [post, ...state.feedPosts.filter((p) => p.id !== post.id)],
      lastNewPostId: post.id,
    })),
  clearLastNewPostId: () => set({ lastNewPostId: null }),
  removeFeedPost: (postId) =>
    set((state) => ({
      feedPosts: state.feedPosts.filter((p) => p.id !== postId),
      lastNewPostId: state.lastNewPostId === postId ? null : state.lastNewPostId,
    })),
  syncBillboardModelId: (id) => set({ billboardModelId: id }),

  addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),
  removeIdea: (id) => set((state) => ({ ideas: state.ideas.filter((i) => i.id !== id) })),
  likeIdea: (id, uid) =>
    set((state) => ({
      ideas: state.ideas.map((i) => {
        if (i.id === id) {
          const likes = Array.isArray(i.likes) ? i.likes : []
          const nextLikes = likes.includes(uid) ? likes.filter((x) => x !== uid) : [...likes, uid]
          return { ...i, likes: nextLikes }
        }
        return i
      }),
    })),

  addDesign: (design) => set((state) => ({ designs: [design, ...state.designs] })),
  removeDesign: (id) => set((state) => ({ designs: state.designs.filter((d) => d.id !== id) })),

  addChallenge: (challenge) => set((state) => ({ challenges: [challenge, ...state.challenges] })),
  updateChallenge: (id, updates) =>
    set((state) => ({
      challenges: state.challenges.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  deleteChallenge: (id) => set((state) => ({ challenges: state.challenges.filter((c) => c.id !== id) })),
  setBillboardModelId: (id) => set({ billboardModelId: id }),
}))
