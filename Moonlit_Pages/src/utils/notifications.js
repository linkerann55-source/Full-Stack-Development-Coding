
const STORAGE_KEY = 'moonlit_pages_notifications'
const EVENT_NAME = 'moonlit-notifications-updated'

const initialNotifications = [
  {
    id: 'demo-1',
    type: 'like',
    username: 'Luna Rose',
    avatar: '🌙',
    message: 'liked your story',
    target: 'Moonlit Promise',
    storyId: 'moonlit-promise',
    time: '5 minutes ago',
    read: false,
  },
  {
    id: 'demo-2',
    type: 'comment',
    username: 'Mira',
    avatar: '🌸',
    message: 'commented on your story',
    target: 'Your latest chapter',
    storyId: 'letters-to-you',
    time: '1 hour ago',
    read: false,
  },
  {
    id: 'demo-3',
    type: 'follow',
    username: 'Noah Grey',
    avatar: '🖤',
    message: 'started following you',
    target: '',
    storyId: '',
    profileUsername: 'Noah Grey',
    time: '3 hours ago',
    read: false,
  },
]

function isLongEncodedString(value) {
  return (
    typeof value === 'string' &&
    value.length > 100 &&
    /^[A-Za-z0-9+/=\s]+$/.test(value)
  )
}

function cleanText(value, fallback = '') {
  if (typeof value !== 'string') return fallback

  const text = value.trim()

  if (!text || /^data:image\//i.test(text)) {
    return fallback
  }

  if (isLongEncodedString(text)) {
    return fallback
  }

  return text
}

function cleanAvatar(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '🌙'
  }

  const avatar = value.trim()

  if (
    /^https?:\/\/\S+$/i.test(avatar) ||
    /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(avatar)
  ) {
    return avatar
  }

  if (isLongEncodedString(avatar)) {
    return avatar.replace(/\s/g, '')
  }

  if (avatar.length > 30) {
    return '🌙'
  }

  return avatar
}

function cleanNotification(notification, index = 0) {
  if (!notification || typeof notification !== 'object') {
    return null
  }

  const allowedTypes = ['like', 'comment', 'follow']

  const type = allowedTypes.includes(notification.type)
    ? notification.type
    : 'activity'

  return {
    ...notification,
    id:
      typeof notification.id === 'string' ||
      typeof notification.id === 'number'
        ? String(notification.id)
        : `notification-${index}-${Date.now()}`,
    type,
    username: cleanText(notification.username, 'Moonlit Pages'),
    avatar: cleanAvatar(notification.avatar),
    message: cleanText(notification.message, 'sent you an update'),
    target: cleanText(notification.target, ''),
    storyId: cleanText(notification.storyId, ''),
    profileUsername: cleanText(notification.profileUsername, ''),
    time: cleanText(notification.time, 'Recently'),
    read: Boolean(notification.read),
  }
}

function cleanNotificationList(notifications) {
  if (!Array.isArray(notifications)) return []

  return notifications
    .map((notification, index) =>
      cleanNotification(notification, index),
    )
    .filter(Boolean)
}

function readStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved !== null) {
      const parsed = JSON.parse(saved)

      if (Array.isArray(parsed)) {
        return cleanNotificationList(parsed)
      }
    }
  } catch (error) {
    console.error('Could not read notifications:', error)
  }

  return null
}

export function getNotifications() {
  const saved = readStorage()

  if (saved !== null) {
    return saved
  }

  const cleaned = cleanNotificationList(initialNotifications)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
  } catch (error) {
    console.error('Could not initialize notifications:', error)
  }

  return cleaned
}

export function saveNotifications(notifications) {
  const cleaned = cleanNotificationList(notifications)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    window.dispatchEvent(new Event(EVENT_NAME))
    return cleaned
  } catch (error) {
    console.error('Could not save notifications:', error)
    return null
  }
}

export function addNotification(notification) {
  const current = getNotifications()

  const newNotification = cleanNotification({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'activity',
    username: 'Moonlit Pages',
    avatar: '🌙',
    message: 'sent you an update',
    target: '',
    storyId: '',
    profileUsername: '',
    time: 'Just now',
    read: false,
    ...notification,
    read: false,
  })

  if (!newNotification) return null

  saveNotifications([newNotification, ...current])

  return newNotification
}

export function markNotificationAsRead(id) {
  const updated = getNotifications().map((notification) =>
    notification.id === String(id)
      ? { ...notification, read: true }
      : notification,
  )

  return saveNotifications(updated)
}

export function markAllNotificationsAsRead() {
  return saveNotifications(
    getNotifications().map((notification) => ({
      ...notification,
      read: true,
    })),
  )
}

export function deleteNotification(id) {
  const updated = getNotifications().filter(
    (notification) => notification.id !== String(id),
  )

  return saveNotifications(updated)
}

export function clearNotifications() {
  return saveNotifications([])
}

export function subscribeToNotifications(callback) {
  window.addEventListener(EVENT_NAME, callback)

  return () => {
    window.removeEventListener(EVENT_NAME, callback)
  }
}
