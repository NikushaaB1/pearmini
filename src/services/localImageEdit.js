import pearLogo from '../assets/pear-logo.jpg'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('სურათის ჩატვირთვა ვერ მოხერხდა'))
    img.src = src
  })
}

function wantsPearLogo(prompt) {
  const p = (prompt || '').toLowerCase()
  return /pear|პear|ლოგო|logo|ბრენდ/i.test(p)
}

function wantsWarmth(prompt) {
  const p = (prompt || '').toLowerCase()
  return (
    wantsPearLogo(prompt) ||
    /warm|gold|ოქრ|განათ|illumination|გააუმჯობეს|enhance|retouch|ფოტო/i.test(p)
  )
}

/** Warm golden-hour look via canvas filters + subtle color lift. */
function drawWithWarmth(ctx, canvas, source) {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.filter = 'brightness(1.04) contrast(1.06) saturate(1.18) sepia(0.12)'
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  ctx.filter = 'none'

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, d[i] * 1.04 + 8)
    d[i + 1] = Math.min(255, d[i + 1] * 1.02 + 4)
    d[i + 2] = Math.max(0, d[i + 2] * 0.96)
  }
  ctx.putImageData(imageData, 0, 0)
}

function drawLogo(ctx, canvas, logo) {
  const pad = Math.round(canvas.width * 0.03)
  const targetW = Math.round(canvas.width * 0.14)
  const aspect = logo.height / logo.width
  const targetH = Math.round(targetW * aspect)

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 2
  ctx.drawImage(logo, pad, pad, targetW, targetH)
  ctx.restore()
}

/**
 * Local photo enhancement when Gemini image API is unavailable.
 * @returns {{ data: string, mimeType: string }}
 */
export async function applyLocalImageEdit({ imageBase64, mimeType = 'image/jpeg', prompt = '' }) {
  const dataUrl = imageBase64.includes(',') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`
  const source = await loadImage(dataUrl)

  const canvas = document.createElement('canvas')
  canvas.width = source.naturalWidth || source.width
  canvas.height = source.naturalHeight || source.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas ვერ შეიქმნა')

  if (wantsWarmth(prompt)) {
    drawWithWarmth(ctx, canvas, source)
  } else {
    ctx.drawImage(source, 0, 0)
  }

  if (wantsPearLogo(prompt)) {
    const logo = await loadImage(pearLogo)
    drawLogo(ctx, canvas, logo)
  }

  const outMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg'
  const outQuality = outMime === 'image/jpeg' ? 0.92 : undefined
  const result = canvas.toDataURL(outMime, outQuality)
  const base64 = result.split(',')[1]

  return { data: base64, mimeType: outMime }
}

export function isInstructionLikeText(text) {
  if (!text) return false
  return (
    /Lightroom|Photoshop|ნაბიჯი \d|ინსტრუქცი|HSL|Vibrance|Spot Healing/i.test(text) ||
    (text.length > 800 && /ექსპოზიცია|კონტრასტი|კროპინგი/i.test(text))
  )
}
