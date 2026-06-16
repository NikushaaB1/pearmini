import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music, Play, Pause, Volume2, VolumeX, ChevronRight, ChevronLeft, Volume1 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function FloatingMusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [url, setUrl] = useState(() => localStorage.getItem('pear_bg_music_url') || '')
  const [volume, setVolume] = useState(() => {
    const val = localStorage.getItem('pear_bg_music_vol')
    return val ? parseFloat(val) : 0.5
  })

  const audioRef = useRef(null)

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.loop = true
    audioRef.current.volume = volume

    if (url) {
      audioRef.current.src = url
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      localStorage.setItem('pear_bg_music_vol', volume.toString())
    }
  }, [volume])

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (!url.trim()) {
        toast.error('გთხოვთ ჩააკოპიროთ მუსიკის URL')
        return
      }

      if (audioRef.current.src !== url) {
        audioRef.current.src = url
      }

      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true)
          localStorage.setItem('pear_bg_music_url', url)
        })
        .catch((err) => {
          console.error('Audio playback error:', err)
          const errorMsg = err?.name === 'NotAllowedError' 
            ? 'ბრაუზერი აუდიოს დაკვრას უშედეგდება (ავტოპლეი დახშულია)'
            : err?.name === 'NotSupportedError'
            ? 'ამ ფორმატის აუდიო დაკვრა ვერ ხერხდება'
            : 'აუდიო ფაილის ჩართვა ვერ მოხერხდა. შეამოწმეთ ლინკი.'
          toast.error(errorMsg)
        })
    }
  }

  const handleVolumeUp = () => {
    setVolume((v) => Math.min(1, parseFloat((v + 0.1).toFixed(1))))
  }

  const handleVolumeDown = () => {
    setVolume((v) => Math.max(0, parseFloat((v - 0.1).toFixed(1))))
  }

  const handleUrlChange = (e) => {
    const nextUrl = e.target.value
    setUrl(nextUrl)
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (audioRef.current) {
        audioRef.current.src = ''
      }
    }
  }

  return (
    <div className="fixed bottom-24 left-6 z-50 flex items-end gap-3 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            className="w-72 p-4 rounded-2xl glass-card border shadow-xl flex flex-col gap-3"
            style={{
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-elevated)',
            }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
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
              <label className="text-[10px] text-[var(--text-muted)]">მუსიკის ლინკი (URL):</label>
              <input
                type="text"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://example.com/music.mp3"
                className="w-full text-xs px-2.5 py-1.5 rounded-xl border focus:outline-none"
                style={{
                  background: 'var(--bg-hover)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div className="flex items-center justify-between mt-1">
              <button
                onClick={handlePlayPause}
                className="flex items-center justify-center w-9 h-9 rounded-full text-white transition-all shadow-md"
                style={{ background: 'var(--accent)' }}
              >
                {isPlaying ? <Pause size={14} fill="#fff" /> : <Play size={14} fill="#fff" className="ml-0.5" />}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleVolumeDown}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  title="Volume Down"
                >
                  <VolumeX size={14} />
                </button>
                <span className="text-[10px] font-mono text-[var(--text-muted)] w-8 text-center">
                  {Math.round(volume * 100)}%
                </span>
                <button
                  onClick={handleVolumeUp}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  title="Volume Up"
                >
                  <Volume2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative border"
        style={{
          background: 'var(--bg-card-solid)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <Music size={18} className={isPlaying ? 'text-[var(--accent)] animate-spin [animation-duration:6s]' : 'text-[var(--text-muted)]'} />
        {isPlaying && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-ping" />
        )}
      </motion.button>
    </div>
  )
}
