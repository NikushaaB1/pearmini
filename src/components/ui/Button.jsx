import { motion } from 'framer-motion'

const variants = {
  primary: 'text-[#1a1008] hover:brightness-105 shadow-[var(--shadow-gold)]',
  secondary: 'glass-morphism border hover:border-[var(--border-medium)]',
  ghost: 'glass hover:opacity-90',
  danger: 'bg-red-500/15 text-red-500 border border-red-500/30 backdrop-blur-md',
  luxury: 'glass-morphism text-[var(--text-primary)] hover:brightness-105',
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  disabled = false,
  style,
  ...props
}) {
  const variantStyle =
    variant === 'primary'
      ? { background: 'var(--gradient-gold)', ...style }
      : variant === 'secondary'
        ? {
            color: 'var(--accent-bright)',
            ...style,
          }
        : variant === 'ghost'
          ? {
              background: 'var(--glass-bg-subtle)',
              borderColor: 'var(--glass-border)',
              color: 'var(--text-muted)',
              backdropFilter: 'blur(16px)',
              ...style,
            }
          : style

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      disabled={disabled || loading}
      style={variantStyle}
      className={`
        relative inline-flex items-center justify-center gap-2
        px-6 py-3 rounded-full font-semibold text-sm
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variant === 'primary' ? 'btn-shine' : ''}
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}
      {children}
    </motion.button>
  )
}
