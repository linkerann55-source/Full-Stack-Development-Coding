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

export default adminApi