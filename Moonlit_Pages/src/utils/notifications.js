import {
  getNotifications as fetchNotifications,
  markNotificationAsRead as markRead,
  markAllNotificationsAsRead as markAllRead,
  deleteNotification as removeNotification,
  clearNotifications as removeAllNotifications,
} from '../api/notifications.js'

const EVENT_NAME = 'moonlit-notifications-updated'

function notifyUpdate() {
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function addNotification(notification) {
  const notifications = JSON.parse(
    localStorage.getItem('moonlit_pages_notifications') || '[]'
  )

  const newNotification = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    isRead: false,
    ...notification,
  }

  notifications.unshift(newNotification)

  localStorage.setItem(
    'moonlit_pages_notifications',
    JSON.stringify(notifications)
  )

  window.dispatchEvent(new Event('moonlit-notifications-updated'))
}

export function saveNotifications(notifications) {
  const safeNotifications = Array.isArray(notifications)
    ? notifications
    : []

  localStorage.setItem(
    'moonlit_pages_notifications',
    JSON.stringify(safeNotifications)
  )

  window.dispatchEvent(new Event('moonlit-notifications-updated'))
}

export async function getNotifications() {
  return fetchNotifications()
}

export async function markNotificationAsRead(id) {
  const response = await markRead(id)
  notifyUpdate()
  return response
}

export async function markAllNotificationsAsRead() {
  const response = await markAllRead()
  notifyUpdate()
  return response
}

export async function deleteNotification(id) {
  const response = await removeNotification(id)
  notifyUpdate()
  return response
}

export async function clearNotifications() {
  const response = await removeAllNotifications()
  notifyUpdate()
  return response
}

export function subscribeToNotifications(callback) {
  window.addEventListener(EVENT_NAME, callback)

  return () => {
    window.removeEventListener(EVENT_NAME, callback)
  }
}
