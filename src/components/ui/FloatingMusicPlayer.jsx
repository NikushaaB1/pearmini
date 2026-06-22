import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  extractYouTubeId,
  isYouTubeUrl,
  loadYouTubeIframeApi,
} from '../../utils/youtube'
import { subscribeToBgMusic } from '../../services/musicService'

const STORAGE_VOL = 'pear_bg_music_vol'

export default function FloatingMusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [url, setUrl] = useState('')
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [volume, setVolume] = useState(() => {
    const val = localStorage.getItem(STORAGE_VOL)
    return val ? parseFloat(val) : 0.5
  })
  const [mode, setMode] = useState('audio')

  const audioRef = useRef(null)
  const ytPlayerRef = useRef(null)
  const ytContainerRef = useRef(null)
  const pendingPlayRef = useRef(false)

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
  }, [])

  const destroyYtPlayer = useCallback(() => {
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy()
      } catch {
        /* ignore */
      }
      ytPlayerRef.current = null
    }
    if (ytContainerRef.current) {
      ytContainerRef.current.innerHTML = ''
    }
  }, [])

  const stopAll = useCallback(() => {
    stopAudio()
    destroyYtPlayer()
    setIsPlaying(false)
    pendingPlayRef.current = false
  }, [stopAudio, destroyYtPlayer])

  // Load music URL from Supabase settings (SQL)
  useEffect(() => {
    return subscribeToBgMusic((config) => {
      setMusicEnabled(config.enabled)
      if (config.url) {
        setUrl(config.url)
        setMode(isYouTubeUrl(config.url) ? 'youtube' : 'audio')
      }
      if (config.volume != null && !localStorage.getItem(STORAGE_VOL)) {
        setVolume(config.volume)
      }
    })
  }, [])

  // Initialize HTML audio element (once)
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.loop = true

    const vol = localStorage.getItem(STORAGE_VOL)
    audioRef.current.volume = vol ? parseFloat(vol) : 0.5

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
      destroyYtPlayer()
    }
  }, [destroyYtPlayer])

  // Sync volume
  useEffect(() => {
    localStorage.setItem(STORAGE_VOL, volume.toString())
    if (audioRef.current) audioRef.current.volume = volume
    if (ytPlayerRef.current?.setVolume) {
      try {
        ytPlayerRef.current.setVolume(Math.round(volume * 100))
      } catch {
        /* ignore */
      }
    }
  }, [volume])

  const initYouTubePlayer = useCallback(
    async (videoId, autoplay = false) => {
      await loadYouTubeIframeApi()

      if (!ytContainerRef.current) return

      destroyYtPlayer()

      pendingPlayRef.current = autoplay

      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        height: 1,
        width: 1,
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          loop: 1,
          playlist: videoId,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            try {
              event.target.setVolume(Math.round(volume * 100))
              if (pendingPlayRef.current) {
                event.target.playVideo()
              }
            } catch {
              /* ignore */
            }
          },
          onStateChange: (event) => {
            const YT = window.YT
            if (!YT) return
            if (event.data === YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              pendingPlayRef.current = false
            } else if (
              event.data === YT.PlayerState.PAUSED ||
              event.data === YT.PlayerState.ENDED
            ) {
              setIsPlaying(false)
            }
          },
          onError: () => {
            setIsPlaying(false)
            toast.error('YouTube ვიდეო ვერ ჩაირთო — შეამოწმე ლინკი')
          },
        },
      })
    },
    [destroyYtPlayer, volume]
  )

  const handlePlayPause = async () => {
    const trimmed = url.trim()

    if (!musicEnabled) {
      toast.error('ფონური მუსიკა გამორთულია ადმინის მიერ')
      return
    }

    if (!trimmed) {
      toast.error('ადმინი ჯერ უნდა დაამატოს მუსიკის ლინკი')
      return
    }

    if (isPlaying) {
      if (mode === 'youtube' && ytPlayerRef.current?.pauseVideo) {
        ytPlayerRef.current.pauseVideo()
      } else if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsPlaying(false)
      return
    }

    if (isYouTubeUrl(trimmed)) {
      const videoId = extractYouTubeId(trimmed)
      if (!videoId) {
        toast.error('YouTube ლინკი არასწორია')
        return
      }

      stopAudio()
      setMode('youtube')

      const currentId =
        ytPlayerRef.current?.getVideoData?.()?.video_id

      if (ytPlayerRef.current && currentId === videoId) {
        try {
          ytPlayerRef.current.playVideo()
          return
        } catch {
          destroyYtPlayer()
        }
      }

      try {
        await initYouTubePlayer(videoId, true)
      } catch {
        toast.error('YouTube პლეერი ვერ ჩაირთო')
      }
      return
    }

    // Direct audio URL
    destroyYtPlayer()
    setMode('audio')

    if (!audioRef.current) return

    try {
      if (audioRef.current.src !== trimmed) {
        audioRef.current.src = trimmed
      }
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (err) {
      console.error('Audio playback error:', err)
      const errorMsg =
        err?.name === 'NotAllowedError'
          ? 'ბრაუზერი აუდიოს დაკვრას უშედეგდება — დააჭირე Play ღილაკს'
          : err?.name === 'NotSupportedError'
            ? 'ამ ფორმატის აუდიო დაკვრა ვერ ხერხდება'
            : 'აუდიო ვერ ჩაირთო. გამოიყენე YouTube ან MP3 ლინკი.'
      toast.error(errorMsg)
    }
  }

  const handleVolumeUp = () => {
    setVolume((v) => Math.min(1, parseFloat((v + 0.1).toFixed(1))))
  }

  const handleVolumeDown = () => {
    setVolume((v) => Math.max(0, parseFloat((v - 0.1).toFixed(1))))
  }

  const youtubeId = extractYouTubeId(url)
  const youtubeWatchUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null

  const panel = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 12 }}
          className="app-dock-panel app-dock-panel--music app-music-panel"
        >
            <div
              className="flex items-center justify-between border-b pb-2"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <Music className="text-[var(--accent)] animate-pulse" size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                  ფონური მუსიკა
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-medium">
                {isPlaying ? 'მიმდინარეობს' : 'შეჩერებულია'}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-[var(--text-muted)]">
                YouTube ან MP3 ლინკი:
              </label>
              <input
                type="text"
                value={url}
                readOnly
                placeholder="ადმინი დაამატებს YouTube ლინკს"
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border opacity-90 cursor-default"
                style={{
                  background: 'var(--bg-hover)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                ლინკი ინახება <span className="text-[var(--accent)]">Supabase SQL</span>-ში.
                შეცვლა: ადმინ პანელი → მუსიკა
              </p>
            </div>

            {youtubeId && (
              <div
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-[10px]"
                style={{ background: 'var(--bg-hover)' }}
              >
                <span className="text-[var(--text-muted)] truncate">
                  YouTube · {youtubeId}
                </span>
                {youtubeWatchUrl && (
                  <a
                    href={youtubeWatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1 text-[var(--accent)] hover:underline"
                  >
                    <ExternalLink size={10} />
                    ნახვა
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-1">
              <button
                onClick={handlePlayPause}
                className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-all shadow-md btn-shine"
                style={{ background: 'var(--gradient-gold)' }}
                aria-label={isPlaying ? 'შეჩერება' : 'დაკვრა'}
              >
                {isPlaying ? (
                  <Pause size={15} fill="#1a1008" color="#1a1008" />
                ) : (
                  <Play size={15} fill="#1a1008" color="#1a1008" className="ml-0.5" />
                )}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleVolumeDown}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  title="დაბალი"
                >
                  <VolumeX size={14} />
                </button>
                <span className="text-[10px] font-mono text-[var(--text-muted)] w-8 text-center">
                  {Math.round(volume * 100)}%
                </span>
                <button
                  onClick={handleVolumeUp}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  title="მაღალი"
                >
                  <Volume2 size={14} />
                </button>
              </div>
            </div>

            {mode === 'youtube' && (
              <p className="text-[9px] text-[var(--text-subtle)] text-center">
                YouTube მუსიკა · loop ჩართულია
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
  )

  const fab = (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsOpen(!isOpen)}
      className={`app-dock-btn ${isOpen ? 'app-dock-btn--active' : ''}`}
      aria-label="მუსიკის პლეერი"
      aria-pressed={isOpen}
    >
      <Music
        size={18}
        className={
          isPlaying
            ? 'text-[var(--accent)] animate-spin [animation-duration:6s]'
            : 'text-[var(--text-muted)]'
        }
      />
      {isPlaying && <span className="app-dock-btn-ping" aria-hidden />}
    </motion.button>
  )

  return (
    <div className="app-music-trigger font-sans max-w-[calc(100vw-1.5rem)]">
      <div
        ref={ytContainerRef}
        className="fixed w-px h-px opacity-0 pointer-events-none overflow-hidden"
        style={{ left: -9999, top: -9999 }}
        aria-hidden
      />
      {panel}
      {fab}
    </div>
  )
}
