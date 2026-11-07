import api from './axios'

export async function getProfile() {
  const response = await api.get('/profile')
  return response.data.profile
}

export async function updateProfile(profileData) {
  const formData = new FormData()

  formData.append('bio', profileData.bio || '')
  formData.append('favorite_genre', profileData.favoriteGenre || '')

  if (profileData.avatar instanceof File) {
    formData.append('avatar', profileData.avatar)
  }

  if (profileData.coverPhoto instanceof File) {
    formData.append('cover_photo', profileData.coverPhoto)
  }

  const response = await api.post('/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data.profile
}