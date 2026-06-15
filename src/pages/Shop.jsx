import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gift, ShoppingBag, Sparkles, Coins, Check, CreditCard, Plane, Sun, Compass, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import PageTransition from '../components/animations/PageTransition'
import { FadeInContainer, FadeInItem } from '../components/animations/FadeIn'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useUserStore } from '../store/useUserStore'
import { redeemReward } from '../services/rewardsService'

export default function Shop() {
  const { role, modelId, points, models } = useUserStore()
  const [selectedReward, setSelectedReward] = useState(null)
  const [redeeming, setRedeeming] = useState(false)
  const [successReward, setSuccessReward] = useState(null)

  const isModel = role === 'model'
  const myPoints = isModel && modelId ? points[modelId] || 0 : 0
  const myName = isModel && modelId ? models.find((m) => m.id === modelId)?.name : ''

  const rewards = [
    {
      id: 'cash_200',
      title: '50 ლარი ხელზე',
      description: 'გადაცვალე 200 ქულა 50 ლარში. თანხა დაირიცხება შენს პირად ბალანსზე.',
      cost: 200,
      icon: CreditCard,
      color: '#e8b896',
    },
    {
      id: 'boost_50',
      title: '+50 ქულა გემატება',
      description: 'ქულების ბუსტი. დახარჯე 300 ქულა და მიიღე +50 ქულა დამატებით (Trade-In).',
      cost: 300,
      icon: Coins,
      color: '#38bdf8',
    },
    {
      id: 'batumi_3',
      title: 'ბათუმში დასვენება',
      description: 'ელიტური 3-დღიანი საგზური ბათუმის პრემიუმ სასტუმროში PEAR™-ისგან.',
      cost: 500,
      icon: Sun,
      color: '#fb7185',
    },
    {
      id: 'cash_800',
      title: '80 ლარი ხელზე',
      description: 'გადაცვალე 800 ქულა 80 ლარში. თანხა დაირიცხება შენს პირად ბალანსზე.',
      cost: 800,
      icon: CreditCard,
      color: '#facc15',
    },
    {
      id: 'kisa_donate',
      title: 'Kisa.ge დონაცია',
      description: `გახსნა შენი Kisa.ge დონაცია გვერდი და მიიღე კიდევ ქულები!`,
      cost: 0,
      icon: Link2,
      color: '#06b6d4',
      isLink: true,
      getLink: (modelId) => `https://www.kisa.ge/donate/${modelId || 'onlyy'}`,
    },
  ]

  const handleRedeemClick = (reward) => {
    if (!isModel) {
      toast.error('საჩუქრების გადაცვლა შეუძლიათ მხოლოდ მოდელებს')
      return
    }

    // Handle link rewards
    if (reward.isLink) {
      const link = reward.getLink?.(modelId)
      if (link) {
        window.open(link, '_blank')
        toast.success('Kisa.ge გვერდი გაიხსნა! 🎉')
      }
      return
    }

    if (myPoints < reward.cost) {
      toast.error('არ გაქვთ საკმარისი ქულა')
      return
    }
    setSelectedReward(reward)
  }

  const handleConfirmRedeem = async () => {
    if (!selectedReward || !modelId) return

    setRedeeming(true)
    try {
      await redeemReward(modelId, selectedReward)
      setSuccessReward(selectedReward)
      setSelectedReward(null)
    } catch (err) {
      toast.error(err.message || 'გადაცვლა ვერ მოხერხდა')
    } finally {
      setRedeeming(false)
    }
  }

  return (
    <PageTransition>
      <FadeInContainer>
        <FadeInItem>
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[var(--accent)] text-xs uppercase tracking-[0.2em] mb-2">
                <Sparkles size={12} />
                მაღაზია
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight flex items-center gap-3 text-[var(--text-primary)]">
                <ShoppingBag size={30} strokeWidth={1.5} className="text-[var(--accent)]" />
                ქულების გადაცვლა
              </h1>
              <p className="text-[var(--text-muted)] mt-1.5">გადაცვალე შენი ქულები ელიტურ საჩუქრებსა და პრივილეგიებში</p>
            </div>

            {isModel && (
              <div
                className="px-6 py-4 rounded-3xl border flex items-center gap-4 shadow-lg"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-medium)',
                }}
              >
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)]">
                  <Coins size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">შენი ბალანსი</p>
                  <p className="text-xl font-bold text-[var(--text-primary)]">{myPoints} ქულა</p>
                </div>
              </div>
            )}
          </div>
        </FadeInItem>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward, i) => {
            const canAfford = myPoints >= reward.cost
            const isAffordableForModel = isModel && canAfford

            return (
              <FadeInItem key={reward.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="h-full"
                >
                  <Card hover className="h-full flex flex-col justify-between border" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center"
                          style={{
                            background: `rgba(${parseInt(reward.color.slice(1,3), 16)}, ${parseInt(reward.color.slice(3,5), 16)}, ${parseInt(reward.color.slice(5,7), 16)}, 0.15)`,
                            color: reward.color,
                          }}
                        >
                          <reward.icon size={22} />
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest block font-bold">ღირებულება</span>
                          <span className="text-md font-bold text-[var(--text-primary)]">{reward.cost} ქულა</span>
                        </div>
                      </div>

                      <h3 className="font-semibold text-md text-[var(--text-primary)]">{reward.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">{reward.description}</p>
                    </div>

                    <div className="mt-6">
                      <Button
                        onClick={() => handleRedeemClick(reward)}
                        disabled={!isModel || !canAfford}
                        className="w-full"
                        variant={isAffordableForModel ? 'default' : 'secondary'}
                      >
                        <Gift size={14} /> {!isModel ? 'მიუწვდომელია' : canAfford ? 'საჩუქარში გადაცვლა' : 'არ გყოფნის ქულები'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </FadeInItem>
            )
          })}
        </div>

        {/* Confirmation Modal */}
        <Modal
          isOpen={selectedReward !== null}
          onClose={() => setSelectedReward(null)}
          title="საჩუქრის გადაცვლა"
        >
          {selectedReward && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                ნამდვილად გსურთ გადაცვალოთ <span className="font-bold text-[var(--text-primary)]">{selectedReward.cost} ქულა</span> საჩუქარში:
                <br />
                <span className="font-semibold text-sm text-[var(--accent)]">{selectedReward.title}</span>?
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setSelectedReward(null)} className="flex-1" disabled={redeeming}>
                  გაუქმება
                </Button>
                <Button onClick={handleConfirmRedeem} className="flex-1" disabled={redeeming}>
                  {redeeming ? 'გადაიცვლება...' : 'გადაცვლა'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Success Modal */}
        <Modal
          isOpen={successReward !== null}
          onClose={() => setSuccessReward(null)}
          title="გილოცავთ! 🎉"
        >
          {successReward && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <Check size={32} />
              </div>
              <h3 className="font-bold text-md text-[var(--text-primary)]">ქულები წარმატებით გადაიცვალა!</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto">
                თქვენ გადაცვალეთ ქულები საჩუქარში: <br />
                <span className="font-semibold text-[var(--accent)]">{successReward.title}</span>.
                <br />
                ადმინისტრატორი პირადად დაგიკავშირდებათ ჯილდოს მისაღებად და დეტალების შესათანხმებლად.
              </p>
              <Button onClick={() => setSuccessReward(null)} className="w-full mt-2">
                დახურვა
              </Button>
            </div>
          )}
        </Modal>
      </FadeInContainer>
    </PageTransition>
  )
}
