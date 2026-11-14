import api from './axios.js'

// Get conversations
export async function getConversations(username = '') {
  const response = await api.get('/conversations', {
    params: username ? { username } : {},
  })

  return response.data?.data ?? []
}

// Create conversation
export async function createConversation(text) {
  const response = await api.post('/conversations', { text })
  return response.data?.data
}

// Update conversation
export async function updateConversation(id, text) {
  const response = await api.put(`/conversations/${id}`, { text })
  return response.data?.data
}

// Delete conversation
export async function deleteConversation(id) {
  return api.delete(`/conversations/${id}`)
}

// Add conversation reply
export async function addConversationReply(id, text) {
  const response = await api.post(`/conversations/${id}/replies`, { text })
  return response.data?.data
}

// Get polls
export async function getPolls(username = '') {
  const response = await api.get('/polls', {
    params: username ? { username } : {},
  })

  return response.data?.data ?? []
}

// Create poll
export async function createPoll(question, options) {
  const response = await api.post('/polls', {
    question,
    options,
  })

  return response.data?.data
}

// Vote in poll
export async function votePoll(pollId, optionId) {
  const response = await api.post(`/polls/${pollId}/vote`, {
    option_id: optionId,
  })

  return response.data?.data
}

// Add poll reply
export async function addPollReply(pollId, text) {
  const response = await api.post(`/polls/${pollId}/replies`, {
    text,
  })

  return response.data?.data
}

// Delete poll
export async function deletePoll(pollId) {
  return api.delete(`/polls/${pollId}`)
}