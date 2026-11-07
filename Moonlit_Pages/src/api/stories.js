import api from './axios'

// Get published stories with optional search and genre filters
export const getStories = async (params = {}, config = {}) => {
  const response = await api.get('/stories', {
    params,
    ...config,
  })

  return response.data
}

export const getMyStories = async () => {
  const response = await api.get('/my-stories')
  return response.data
}

export const createStory = async (storyData) => {
  const response = await api.post('/stories', storyData)
  return response.data
}

export const updateStory = async (id, storyData) => {
  const response = await api.put(`/stories/${id}`, storyData)
  return response.data
}

export const deleteStory = async (id) => {
  const response = await api.delete(`/stories/${id}`)
  return response.data
}

export const getStory = async (id) => {
  const response = await api.get(`/stories/${id}`)
  return response.data
}