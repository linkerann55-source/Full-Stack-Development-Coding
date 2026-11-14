
import api from './axios'

export async function getNotifications() {
  const response = await api.get('/notifications')
  return response.data.notifications || []
}

export async function markNotificationAsRead(id) {
  return api.put(`/notifications/${id}/read`)
}

export async function markAllNotificationsAsRead() {
  return api.put('/notifications/read-all')
}

export async function deleteNotification(id) {
  return api.delete(`/notifications/${id}`)
}

export async function clearNotifications() {
  return api.delete('/notifications')
}
