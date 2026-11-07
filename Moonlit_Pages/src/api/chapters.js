
import api from './axios.js'

// Get chapters through the story details API
export async function getChapters(storyId) {
    const response = await api.get(`/stories/${storyId}`)
    return response.data.chapters || []
}

// Get one chapter for reading
export async function getChapter(storyId, chapterId) {
    const response = await api.get(
        `/stories/${storyId}/chapters/${chapterId}`
    )
    return response.data
}

// Create a new chapter
export async function createChapter(storyId, chapterData) {
    const response = await api.post(
        `/stories/${storyId}/chapters`,
        chapterData
    )
    return response.data
}

// Update an existing chapter
export async function updateChapter(storyId, chapterId, chapterData) {
    const response = await api.put(
        `/stories/${storyId}/chapters/${chapterId}`,
        chapterData
    )
    return response.data
}

// Delete a chapter
export async function deleteChapter(storyId, chapterId) {
    const response = await api.delete(
        `/stories/${storyId}/chapters/${chapterId}`
    )
    return response.data
}
