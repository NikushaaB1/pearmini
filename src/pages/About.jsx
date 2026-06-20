import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useCallback } from 'react'
import { Sparkles, Heart, Users, Target, ArrowRight, Upload, FileText, X, Check, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { submitCV } from '../services/cvService'
import brandBg from '../assets/pear-brand.png'
import pearLogo from '../assets/pear-logo.jpg'

/* ── floating particles ── */
function FloatingParticles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
    opacity: Math.random() * 0.3 + 0.05,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `rgba(232, 184, 150, ${p.opacity})`,
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.random() * 40 - 20, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/* ── glow orbs ── */
function GlowOrbs() {
  return (
    <>
      <motion.div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(196,149,106,0.12) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(232,184,150,0.08) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />
      <motion.div
        className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, rgba(196,149,106,0.06) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />
    </>
  )
}

/* ── glass input ── */
function GlassInput({ label, ...props }) {
  return (
    <div className="relative">
      {label && (
        <label className="block text-[11px] uppercase tracking-[0.2em] text-[#f5f0e8]/40 mb-2 font-medium">
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: '1px solid rgba(245, 240, 232, 0.1)',
          borderRadius: '0.875rem',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          fontSize: '0.9rem',
          color: '#f5f0e8',
          transition: 'border-color 0.3s, background 0.3s',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(232, 184, 150, 0.4)'
          e.target.style.background = 'rgba(255, 255, 255, 0.07)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(245, 240, 232, 0.1)'
          e.target.style.background = 'rgba(255, 255, 255, 0.04)'
        }}
      />
    </div>
  )
}

/* ── glass textarea ── */
function GlassTextarea({ label, ...props }) {
  return (
    <div className="relative">
      {label && (
        <label className="block text-[11px] uppercase tracking-[0.2em] text-[#f5f0e8]/40 mb-2 font-medium">
          {label}
        </label>
      )}
      <textarea
        {...props}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          border: '1px solid rgba(245, 240, 232, 0.1)',
          borderRadius: '0.875rem',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          fontSize: '0.9rem',
          color: '#f5f0e8',
          resize: 'none',
          transition: 'border-color 0.3s, background 0.3s',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(232, 184, 150, 0.4)'
          e.target.style.background = 'rgba(255, 255, 255, 0.07)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(245, 240, 232, 0.1)'
          e.target.style.background = 'rgba(255, 255, 255, 0.04)'
        }}
      />
    </div>
  )
}

export default function About() {
  const navigate = useNavigate()
  const [cvFile, setCvFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef(null)
  const formRef = useRef(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      if (allowed.includes(file.type)) {
        setCvFile(file)
      } else {
        toast.error('მხოლოდ PDF ან Word ფაილები')
      }
    }
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) setCvFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const name = e.target.fullName.value
    const email = e.target.email.value
    const message = e.target.message?.value || ''

    if (!name.trim() || !email.trim()) {
      toast.error('სახელი და ელფოსტა აუცილებელია')
      return
    }

    setIsSubmitting(true)
    try {
      await submitCV({ name, email, message, file: cvFile })
      setSubmitted(true)
      toast.success('CV წარმატებით გაიგზავნა!')
      formRef.current?.reset()
      setCvFile(null)
    } catch (err) {
      toast.error(err.message || 'გაგზავნა ვერ მოხერხდა')
    } finally {
      setIsSubmitting(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] },
    },
  }

  const features = [
    {
      icon: Users,
      title: 'მოდელების კომუნიტი',
      description: 'დაკავშირდი საუკეთესო მოდელებთან და გამოავლინე შენი პოტენციალი',
    },
    {
      icon: Target,
      title: 'გამოწვევები & დიზაინი',
      description: 'მონაწილეობა მიიღე გამოწვევებში და დააგროვე ქულები',
    },
    {
      icon: Heart,
      title: 'ქულების სისტემა',
      description: 'გადააკეთე ქულები რეალურ სარგებელში Kisa.ge-ს მეშვეობით',
    },
  ]

  const steps = [
    { num: '01', title: 'მოდელად დარეგისტრირება', desc: 'შექმენი ანგარიში და აირჩიე შენი პროფილი' },
    { num: '02', title: 'ფოტოების ატვირთვა', desc: 'აიტვირთე შენი საუკეთესო მომენტები და დააგროვე ქულები' },
    { num: '03', title: 'გამოწვევებში მონაწილეობა', desc: 'მიიღე მონაწილეობა ელიტურ გამოწვევებში და მოიპოვე პრიზები' },
    { num: '04', title: 'ქულების გამოყენება', desc: 'გადააკეთე ქულები რეალურ სარგებელში' },
  ]

  const stats = [
    { label: 'აქტიური მოდელი', value: '100+' },
    { label: 'გამოწვევა', value: '50+' },
    { label: 'ქულა განაწილებული', value: '100K+' },
  ]

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: '#0a1a0f' }}
    >
      {/* ── Background layers ── */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, ease: 'easeOut' }}
        >
          <img
            src={brandBg}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{ opacity: 0.15 }}
          />
        </motion.div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,26,15,0.3) 0%, rgba(10,26,15,0.85) 40%, rgba(10,26,15,0.97) 70%, #0a1a0f 100%)',
          }}
        />
      </div>

      <FloatingParticles />
      <GlowOrbs />

      {/* ── Sticky Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(10, 26, 15, 0.65)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(212, 168, 83, 0.08)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={pearLogo}
              alt="PEAR"
              className="h-9 w-auto rounded-lg object-cover"
              style={{ filter: 'brightness(1.1)' }}
            />
            <span
              className="text-sm font-medium tracking-[0.15em] uppercase"
              style={{ color: 'rgba(245, 240, 232, 0.7)' }}
            >
              Elite
            </span>
          </motion.div>
          <motion.button
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-6 py-2.5 rounded-full text-xs font-medium uppercase tracking-[0.2em] transition-all"
            style={{
              background: 'rgba(245, 240, 232, 0.08)',
              border: '1px solid rgba(245, 240, 232, 0.15)',
              color: '#f5f0e8',
              backdropFilter: 'blur(12px)',
            }}
          >
            შესვლა
          </motion.button>
        </div>
      </motion.header>

      {/* ── Hero Section ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-28 pb-16"
      >
        <motion.div variants={itemVariants} className="text-center mb-6">
          <motion.div
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8"
            style={{
              background: 'rgba(232, 184, 150, 0.08)',
              border: '1px solid rgba(232, 184, 150, 0.15)',
            }}
            whileHover={{ scale: 1.03 }}
          >
            <Sparkles size={14} style={{ color: '#e8b896' }} />
            <span
              className="text-xs font-medium tracking-[0.2em] uppercase"
              style={{ color: '#e8b896' }}
            >
              PEAR Elite Platform
            </span>
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center mb-8">
          {/* Logo Display */}
          <motion.div
            className="mx-auto mb-10 relative"
            style={{ width: 'fit-content' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="relative">
              <img
                src={pearLogo}
                alt="PEAR"
                className="h-20 sm:h-28 w-auto mx-auto rounded-2xl"
                style={{
                  filter: 'brightness(1.1)',
                  boxShadow: '0 0 80px rgba(232, 184, 150, 0.15)',
                }}
              />
              <motion.div
                className="absolute -inset-4 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(232,184,150,0.1) 0%, transparent 70%)',
                }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          </motion.div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-[0.05em] leading-tight mb-6"
            style={{ color: '#f5f0e8' }}
          >
            მოდელების
            <br />
            <span
              className="font-semibold"
              style={{
                background: 'linear-gradient(135deg, #e8b896 0%, #c4956a 50%, #e8b896 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ელიტური სოციალური ქსელი
            </span>
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-light"
            style={{ color: 'rgba(245, 240, 232, 0.5)' }}
          >
            PEAR™ — ეს არის ადგილი, სადაც ელიტური მოდელები გაერთიანდებიან, იზიარებენ
            კრეატიულობას და აგროვებენ ქულებს.
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mt-12"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={24} style={{ color: 'rgba(245, 240, 232, 0.2)' }} />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Features Section ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
      >
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.01 }}
              className="group relative p-7 rounded-2xl transition-all duration-500 cursor-default"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(245, 240, 232, 0.07)',
                backdropFilter: 'blur(16px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
                e.currentTarget.style.borderColor = 'rgba(232, 184, 150, 0.2)'
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(232, 184, 150, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'
                e.currentTarget.style.borderColor = 'rgba(245, 240, 232, 0.07)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: 'rgba(232, 184, 150, 0.1)',
                  border: '1px solid rgba(232, 184, 150, 0.15)',
                }}
              >
                <feature.icon size={22} style={{ color: '#e8b896' }} strokeWidth={1.5} />
              </div>
              <h3
                className="text-lg font-semibold mb-2 tracking-wide"
                style={{ color: '#f5f0e8' }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'rgba(245, 240, 232, 0.45)' }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── Stats Section ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-10 rounded-3xl px-8"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(245, 240, 232, 0.06)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              className="text-center py-4"
              style={{
                borderRight: idx < stats.length - 1 ? '1px solid rgba(245, 240, 232, 0.06)' : 'none',
              }}
            >
              <motion.p
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{
                  background: 'linear-gradient(135deg, #e8b896, #c4956a)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                {stat.value}
              </motion.p>
              <p
                className="text-sm font-light tracking-wide"
                style={{ color: 'rgba(245, 240, 232, 0.45)' }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── CV Submission Section ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
        id="cv-section"
      >
        <motion.div variants={itemVariants} className="text-center mb-10">
          <p
            className="text-xs uppercase tracking-[0.3em] mb-3"
            style={{ color: '#e8b896' }}
          >
            თანამშრომლობა
          </p>
          <h2
            className="text-2xl sm:text-3xl font-light tracking-wide mb-3"
            style={{ color: '#f5f0e8' }}
          >
            გინდა გახდე ნაწილი?
          </h2>
          <p
            className="text-sm max-w-md mx-auto"
            style={{ color: 'rgba(245, 240, 232, 0.4)' }}
          >
            გამოგვიგზავნე შენი CV და ჩვენი გუნდი დაგიკავშირდება
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="max-w-2xl mx-auto rounded-3xl p-8 sm:p-10"
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(245, 240, 232, 0.08)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4)',
          }}
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-10"
              >
                <motion.div
                  className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
                  style={{
                    background: 'rgba(232, 184, 150, 0.15)',
                    border: '1px solid rgba(232, 184, 150, 0.3)',
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Check size={28} style={{ color: '#e8b896' }} />
                </motion.div>
                <h3 className="text-xl font-light mb-2" style={{ color: '#f5f0e8' }}>
                  წარმატებით გაიგზავნა!
                </h3>
                <p className="text-sm mb-6" style={{ color: 'rgba(245, 240, 232, 0.45)' }}>
                  ჩვენი გუნდი გადახედავს თქვენს CV-ს და დაგიკავშირდებათ ელფოსტაზე
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-full text-xs uppercase tracking-[0.15em]"
                  style={{
                    background: 'rgba(232, 184, 150, 0.1)',
                    border: '1px solid rgba(232, 184, 150, 0.2)',
                    color: '#e8b896',
                  }}
                >
                  ხელახლა გაგზავნა
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                ref={formRef}
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GlassInput name="fullName" label="სახელი გვარი" placeholder="სახელი გვარი" required />
                  <GlassInput name="email" type="email" label="ელფოსტა" placeholder="name@email.com" required />
                </div>

                {/* File Upload Area */}
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-[#f5f0e8]/40 mb-2 font-medium">
                    CV ფაილი
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative rounded-2xl p-6 text-center cursor-pointer transition-all duration-300"
                    style={{
                      border: `2px dashed ${isDragging ? 'rgba(232, 184, 150, 0.5)' : 'rgba(245, 240, 232, 0.1)'}`,
                      background: isDragging
                        ? 'rgba(232, 184, 150, 0.05)'
                        : 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <AnimatePresence mode="wait">
                      {cvFile ? (
                        <motion.div
                          key="file"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center justify-center gap-3"
                        >
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                              background: 'rgba(232, 184, 150, 0.15)',
                              border: '1px solid rgba(232, 184, 150, 0.2)',
                            }}
                          >
                            <FileText size={18} style={{ color: '#e8b896' }} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium" style={{ color: '#f5f0e8' }}>
                              {cvFile.name}
                            </p>
                            <p className="text-[11px]" style={{ color: 'rgba(245, 240, 232, 0.35)' }}>
                              {(cvFile.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setCvFile(null)
                            }}
                            className="ml-2 p-1.5 rounded-lg transition-colors"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'rgba(245, 240, 232, 0.4)',
                            }}
                          >
                            <X size={14} />
                          </motion.button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="upload"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Upload
                            size={28}
                            className="mx-auto mb-3"
                            style={{ color: 'rgba(245, 240, 232, 0.2)' }}
                          />
                          <p className="text-sm" style={{ color: 'rgba(245, 240, 232, 0.4)' }}>
                            ჩააგდეთ ფაილი აქ ან{' '}
                            <span style={{ color: '#e8b896' }}>აირჩიეთ</span>
                          </p>
                          <p className="text-[11px] mt-1" style={{ color: 'rgba(245, 240, 232, 0.2)' }}>
                            PDF, DOC, DOCX • მაქს. 10MB
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <GlassTextarea
                  name="message"
                  label="მესიჯი (არასავალდებულო)"
                  placeholder="მოგვიყევით თქვენს შესახებ..."
                  rows={4}
                />

                <div className="flex justify-end pt-2">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                    whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                    className="relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50"
                    style={{
                      background: '#f5f0e8',
                      color: '#1a1a1a',
                      boxShadow: '0 0 30px rgba(232, 184, 150, 0.15)',
                    }}
                  >
                    {isSubmitting && (
                      <span className="w-4 h-4 border-2 border-[#1a1a1a]/20 border-t-[#1a1a1a] rounded-full animate-spin" />
                    )}
                    გაგზავნა
                    <ArrowRight size={14} />
                  </motion.button>
                </div>

                <p className="text-center text-[11px]" style={{ color: 'rgba(245, 240, 232, 0.25)' }}>
                  მიიღებთ პასუხს ადმინისტრატორიდან ელფოსტაზე
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.section>

      {/* ── How it Works ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <p
            className="text-xs uppercase tracking-[0.3em] mb-3"
            style={{ color: '#e8b896' }}
          >
            პროცესი
          </p>
          <h2
            className="text-2xl sm:text-3xl font-light tracking-wide"
            style={{ color: '#f5f0e8' }}
          >
            როგორ მუშაობს PEAR Elite
          </h2>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ x: 6 }}
              className="group flex gap-5 items-start p-6 rounded-2xl transition-all duration-500 cursor-default"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(245, 240, 232, 0.06)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(232, 184, 150, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                e.currentTarget.style.borderColor = 'rgba(245, 240, 232, 0.06)'
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500"
                style={{
                  background: 'linear-gradient(135deg, rgba(232,184,150,0.15), rgba(196,149,106,0.1))',
                  border: '1px solid rgba(232, 184, 150, 0.2)',
                }}
              >
                <span
                  className="text-sm font-bold tracking-wider"
                  style={{ color: '#e8b896' }}
                >
                  {step.num}
                </span>
              </div>
              <div className="flex-1 pt-1">
                <h3
                  className="text-base font-semibold mb-1 tracking-wide"
                  style={{ color: '#f5f0e8' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'rgba(245, 240, 232, 0.4)' }}
                >
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ── CTA Section ── */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20"
      >
        <motion.div
          variants={itemVariants}
          className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(232,184,150,0.12) 0%, rgba(196,149,106,0.06) 100%)',
            border: '1px solid rgba(232, 184, 150, 0.15)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* CTA glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(232,184,150,0.15) 0%, transparent 70%)' }}
          />

          <div className="relative z-10">
            <h2
              className="text-2xl sm:text-3xl font-light tracking-wide mb-4"
              style={{ color: '#f5f0e8' }}
            >
              დაიწყე თანამშრომლობა{' '}
              <span style={{ color: '#e8b896' }}>PEAR™</span>-თან
            </h2>
            <p
              className="text-sm sm:text-base max-w-xl mx-auto mb-8 font-light leading-relaxed"
              style={{ color: 'rgba(245, 240, 232, 0.5)' }}
            >
              იყავი ელიტური მოდელი, გამოავლინე შენი კრეატიული პოტენციალი და
              იმუშავე ტოპ ბრენდებთან
            </p>
            <motion.button
              onClick={() => navigate('/login')}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300"
              style={{
                background: '#f5f0e8',
                color: '#1a1a1a',
                boxShadow: '0 0 40px rgba(232, 184, 150, 0.2)',
              }}
            >
              ახლა შექმენი ანგარიში
              <ArrowRight size={16} />
            </motion.button>
          </div>
        </motion.div>
      </motion.section>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 py-12"
        style={{ borderTop: '1px solid rgba(245, 240, 232, 0.05)' }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={pearLogo}
                alt="PEAR"
                className="h-7 w-auto rounded-md"
                style={{ filter: 'brightness(1.1)', opacity: 0.7 }}
              />
              <span
                className="text-xs tracking-[0.1em]"
                style={{ color: 'rgba(245, 240, 232, 0.25)' }}
              >
                Elite Platform
              </span>
            </div>
            <p
              className="text-xs"
              style={{ color: 'rgba(245, 240, 232, 0.2)' }}
            >
              © 2026 PEAR™ — All rights reserved
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
