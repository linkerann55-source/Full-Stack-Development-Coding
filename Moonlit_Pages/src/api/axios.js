
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
  },
})

// Attach user token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('moonlit_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Handle unauthorized and suspended accounts
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status
    const message = error.response?.data?.message || ''

    if (
      status === 403 &&
      message.toLowerCase().includes('suspended')
    ) {
      // Remove invalid user session
      localStorage.removeItem('moonlit_token')
      localStorage.removeItem('moonlit_user')

      // Notify the user
      alert(message)

      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    if (status === 401) {
      localStorage.removeItem('moonlit_token')
      localStorage.removeItem('moonlit_user')

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
