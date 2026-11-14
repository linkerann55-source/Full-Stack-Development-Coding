import api from './axios'

export async function getProfile() {
  const response = await api.get('/profile')
  return response.data.profile
}

export async function updateProfile(profileData) {
  const response = await api.put('/profile', {
    username: profileData.username,
    bio: profileData.bio || '',
    favorite_genre: profileData.favoriteGenre || '',
  })

  return response.data.profile
}


export async function uploadProfilePhotos(photoFiles) {
  const formData = new FormData()

  if (photoFiles.avatar instanceof File) {
    formData.append('avatar', photoFiles.avatar)
  }

  if (photoFiles.coverPhoto instanceof File) {
    formData.append('cover_photo', photoFiles.coverPhoto)
  }

  const response = await api.post('/profile/photos', formData)

  return response.data.profile
}

export const searchUsers = async (query) => {
  const response = await api.get('/users/search', {
    params: { query },
  })

  return response.data
}