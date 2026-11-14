import api from '../api/axios.js'

// Get comments
export const getComments = async (storyId) => {
  const response = await api.get(`/stories/${storyId}/comments`)
  return response.data
}

// Add comment
export const addComment = async (storyId, content) => {
  const response = await api.post(`/stories/${storyId}/comments`, {
    content,
  })
  return response.data
}

// Edit comment
export const updateComment = async (commentId, content) => {
  const response = await api.put(`/comments/${commentId}`, {
    content,
  })
  return response.data
}

// Delete comment
export const deleteComment = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`)
  return response.data
}
