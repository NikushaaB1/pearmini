import { supabase } from './supabaseClient'
import { isConfigured } from './supabaseConfig'
import { useUserStore } from '../store/useUserStore'

const SMS_STORE_KEY = 'pear_sms_messages'

/** SMS ლინკი — დაჭერისას დავალება ავტომატურად შესრულდება */
export function buildDailyTaskCompleteLink(taskId) {
  if (!taskId) return ''
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : ''
  const path = `/daily-tasks?complete=${encodeURIComponent(taskId)}`
  return origin ? `${origin}${path}` : path
}

export function appendTaskLinkToMessage(message, taskId) {
  const link = buildDailyTaskCompleteLink(taskId)
  if (!link) return message?.trim() || ''
  const base = (message || '').trim()
  if (base.includes(link)) return base
  const suffix = base ? `\n${link}` : link
  return `${base}${suffix}`.trim()
}

function getLocalSMS() {
  const data = localStorage.getItem(SMS_STORE_KEY)
  return data ? JSON.parse(data) : []
}

function saveLocalSMS(messages) {
  localStorage.setItem(SMS_STORE_KEY, JSON.stringify(messages))
}

export async function sendSMS(phoneNumber, message, recipientName = 'მოდელი') {
  if (!phoneNumber || !message.trim()) {
    throw new Error('ტელეფონი და შეტყობინება აუცილებელია')
  }

  const smsData = {
    id: `sms_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    phoneNumber,
    message: message.trim(),
    recipientName,
    sentAt: new Date().toISOString(),
    status: 'sent',
  }

  if (!isConfigured || !supabase) {
    const messages = getLocalSMS()
    messages.push(smsData)
    saveLocalSMS(messages)
    return smsData
  }

  // In production, you would use a real SMS provider like Twilio
  // For now, store in a database table
  try {
    const { data, error } = await supabase
      .from('sms_messages')
      .insert({
        phone_number: phoneNumber,
        message: message.trim(),
        recipient_name: recipientName,
        status: 'sent',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    // Fallback to local storage if table doesn't exist
    const messages = getLocalSMS()
    messages.push(smsData)
    saveLocalSMS(messages)
    return smsData
  }
}

export function getSMSHistory() {
  if (!isConfigured || !supabase) {
    return getLocalSMS()
  }
  // In production, fetch from database
  return getLocalSMS()
}

export function subscribeSMSMessages(callback) {
  if (!isConfigured || !supabase) {
    callback(getLocalSMS())
    const interval = setInterval(() => {
      callback(getLocalSMS())
    }, 1000)
    return () => clearInterval(interval)
  }

  // Real-time subscription would go here
  callback(getLocalSMS())
  return () => {}
}
