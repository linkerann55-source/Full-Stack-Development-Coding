import axios from 'axios'

const adminApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/admin',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Attach the separate admin token
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('moonlit_admin_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Get all stories for admin
export const getAdminStories = async () => {
  const response = await adminApi.get('/stories')
  return response.data
}

// Publish a story
export const publishAdminStory = async (id) => {
  const response = await adminApi.post(`/stories/${id}/publish`)
  return response.data
}

// Unpublish a story
export const unpublishAdminStory = async (id) => {
  const response = await adminApi.post(`/stories/${id}/unpublish`)
  return response.data
}

// Delete a story
export const deleteAdminStory = async (id) => {
  const response = await adminApi.delete(`/stories/${id}`)
  return response.data
}

// Get all registered users
export const getAdminUsers = async () => {
  const response = await adminApi.get('/users')
  return response.data
}

// Suspend a user
export const suspendAdminUser = async (id) => {
  const response = await adminApi.post(`/users/${id}/suspend`)
  return response.data
}

// Activate a user
export const activateAdminUser = async (id) => {
  const response = await adminApi.post(`/users/${id}/activate`)
  return response.data
}

// Delete a user
export const deleteAdminUser = async (id) => {
  const response = await adminApi.delete(`/users/${id}`)
  return response.data
}

// Get all user reports
export const getAdminReports = async () => {
  const response = await adminApi.get('/reports')
  return response.data
}

// Resolve a user report
export const resolveAdminReport = async (id, adminNote = '') => {
  const response = await adminApi.patch(`/reports/${id}/resolve`, {
    admin_note: adminNote,
  })

  return response.data
}

// Delete a user report
export const deleteAdminReport = async (id) => {
  const response = await adminApi.delete(`/reports/${id}`)
  return response.data
}

// Get admin activity logs
export const getAdminActivityLogs = async (page = 1) => {
  const response = await adminApi.get('/activity-logs', {
    params: { page },
  })

  return response.data
}
export default adminApi