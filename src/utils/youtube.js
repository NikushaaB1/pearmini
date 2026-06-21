/**
 * Extract YouTube video ID from common URL formats.
 * Supports: youtu.be, youtube.com/watch, youtube.com/embed, music.youtube.com
 */
export function extractYouTubeId(url) {
  if (!url?.trim()) return null

  const input = url.trim()

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

export function isYouTubeUrl(url) {
  return extractYouTubeId(url) !== null
}

let ytApiPromise = null

export function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.resolve()

  if (window.YT?.Player) return Promise.resolve()

  if (ytApiPromise) return ytApiPromise

  ytApiPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('youtube-iframe-api')
    if (!existing) {
      const tag = document.createElement('script')
      tag.id = 'youtube-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.onerror = () => reject(new Error('YouTube API load failed'))
      document.head.appendChild(tag)
    }

    const prevReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady()
      resolve()
    }

    // Already loaded between check and script tag
    if (window.YT?.Player) resolve()
  })

  return ytApiPromise
}
