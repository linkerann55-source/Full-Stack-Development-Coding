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

// Report a user profile
export const reportUser = async (userId, reportData) => {
  const response = await api.post(`/users/${userId}/report`, {
    reason: reportData.reason,
    details: reportData.details || '',
  })

  return response.data
}

// Report a story
export const reportStory = async (storyId, reportData) => {
  const response = await api.post(`/stories/${storyId}/report`, {
    reason: reportData.reason,
    details: reportData.details || '',
  })

  return response.data
}

// Report a comment
export const reportComment = async (commentId, reportData) => {
  const response = await api.post(`/comments/${commentId}/report`, {
    reason: reportData.reason,
    details: reportData.details || '',
  })

  return response.data
}