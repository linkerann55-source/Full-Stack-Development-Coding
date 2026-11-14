import api from './axios.js'

export async function getMyChapters(storyId) {
  const response = await api.get(`/my-stories/${storyId}/chapters`)
  return response.data.chapters || []
}

export async function createChapter(storyId, chapterData) {
  const response = await api.post(
    `/stories/${storyId}/chapters`,
    chapterData
  )
  return response.data
}

export async function updateChapter(chapterId, chapterData) {
  const response = await api.put(
    `/chapters/${chapterId}`,
    chapterData
  )
  return response.data
}

export async function deleteChapter(chapterId) {
  const response = await api.delete(`/chapters/${chapterId}`)
  return response.data
}

// Get published chapters for Reader
export async function getChapters(storyId) {
  const response = await api.get(`/stories/${storyId}/chapters`)
  return response.data.chapters || []
}