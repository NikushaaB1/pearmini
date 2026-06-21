import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

/**
 * დავალების შესრულების ფაილების ატვირთვა (ერთ დავალებაზე)
 */
export default function TaskSubmissionZone({ onFilesChange, disabled = false, compact = false }) {
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file), name: file.name })),
    [files]
  )

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [previews])

  const updateFiles = useCallback(
    (next) => {
      setFiles(next)
      onFilesChange?.(next)
    },
    [onFilesChange]
  )

  const processFiles = useCallback(
    (fileList) => {
      const valid = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
      if (!valid.length) return
      updateFiles([...files, ...valid])
    },
    [files, updateFiles]
  )

  const removeFile = (index) => {
    updateFiles(files.filter((_, i) => i !== index))
  }

  const padding = compact ? 'p-4' : 'p-6'

  return (
    <div className="space-y-3">
      <motion.div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (!disabled) processFiles(e.dataTransfer.files)
        }}
        animate={{ borderColor: dragOver ? 'var(--accent)' : 'var(--border-subtle)' }}
        className={`relative border-2 border-dashed rounded-xl ${padding} text-center transition-all ${
          disabled ? 'opacity-50 pointer-events-none' : ''
        }`}
        style={{ background: dragOver ? 'var(--accent-soft)' : 'var(--glass-bg-subtle)' }}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={(e) => {
            processFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <Upload
          className="mx-auto mb-2 text-[var(--text-muted)]"
          size={compact ? 22 : 28}
          strokeWidth={1.5}
        />
        <p className="text-xs text-[var(--text-muted)]">ჩაყარე შესრულების სქრინი/ფოტო აქ</p>
        <p className="text-[10px] text-[var(--text-subtle)] mt-1">ან დააჭირე ფაილის არჩევას</p>
      </motion.div>

      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            {previews.map((preview, i) => (
              <div
                key={preview.url}
                className="relative aspect-square rounded-lg overflow-hidden border"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60"
                  >
                    <X size={10} className="text-white" />
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <p className="text-[10px] text-[var(--accent)] flex items-center gap-1">
          <ImageIcon size={11} />
          {files.length} ფაილი მზადაა ატვირთვისთვის
        </p>
      )}
    </div>
  )
}
