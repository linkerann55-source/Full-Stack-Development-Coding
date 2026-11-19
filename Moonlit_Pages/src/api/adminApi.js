import axios from 'axios'

const adminApi = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Attach the admin token to admin requests only
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('moonlit_admin_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Clear expired or invalid admin sessions
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('moonlit_admin_token')
      localStorage.removeItem('moonlit_admin_logged_in')
      localStorage.removeItem('moonlit_admin_user')
    }

    return Promise.reject(error)
  }
)

export default adminApi
