
import api from '../api/axios.js'

// ==============================
// FOLLOW SYSTEM
// ==============================

// Get a user's followers
export const getFollowers = async (userId) => {
  if (!userId) return []

  const response = await api.get(`/users/${userId}/followers`)

  return response.data.followers || []
}

// Get the users someone follows
export const getFollowing = async (userId) => {
  if (!userId) return []

  const response = await api.get(`/users/${userId}/following`)

  return response.data.following || []
}

// Follow a user
export const followUser = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required.')
  }

  const response = await api.post(`/users/${userId}/follow`)

  return response.data
}

// Unfollow a user
export const unfollowUser = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required.')
  }

  const response = await api.delete(`/users/${userId}/follow`)

  return response.data
}

// Check whether the logged-in user follows another user
export const checkFollow = async (userId) => {
  if (!userId) return false

  const response = await api.get(`/users/${userId}/check-follow`)

  return response.data.following || false
}

// ==============================
// STORY LIKE SYSTEM
// ==============================

// Like a story
export const likeStory = async (storyId) => {
  const response = await api.post(`/stories/${storyId}/like`)

  return response.data
}

// Unlike a story
export const unlikeStory = async (storyId) => {
  const response = await api.delete(`/stories/${storyId}/like`)

  return response.data
}

// Check whether the logged-in user likes a story
export const checkStoryLike = async (storyId) => {
  const response = await api.get(`/stories/${storyId}/check-like`)

  return response.data
}
