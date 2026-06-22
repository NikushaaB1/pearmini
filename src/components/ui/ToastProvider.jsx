import { Toaster } from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'

export default function ToastProvider() {
  const theme = useThemeStore((s) => s.theme)
  const isDark = theme === 'dark'

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#1a1816' : '#ffffff',
          color: isDark ? '#f5f0e8' : '#1a1814',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          borderRadius: '12px',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)',
          padding: '12px 16px',
          fontSize: '14px',
        },
        success: {
          style: {
            border: isDark ? '1px solid rgba(74, 222, 128, 0.25)' : '1px solid rgba(34, 197, 94, 0.25)',
          },
          iconTheme: {
            primary: isDark ? '#4ade80' : '#16a34a',
            secondary: isDark ? '#1a1816' : '#ffffff',
          },
        },
        error: {
          iconTheme: { primary: '#dc2626', secondary: isDark ? '#1a1816' : '#ffffff' },
        },
      }}
    />
  )
}
