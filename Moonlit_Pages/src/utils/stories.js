
const STORIES_KEY = 'moonlit_pages_published_stories'
const DRAFTS_KEY = 'moonlit_pages_drafts'

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeList(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getPublishedStories() {
  return readList(STORIES_KEY)
}

export function publishStory(draft, author) {
  if (!draft.title?.trim() || !draft.content?.trim()) {
    throw new Error('Please add a title and story content before publishing.')
  }

  const stories = getPublishedStories()
  const existing = stories.find((story) => story.id === draft.id)

  const publishedStory = {
    ...existing,
    ...draft,
    id: draft.id || crypto.randomUUID(),
    title: draft.title.trim(),
    description: draft.description?.trim() || '',
    content: draft.content,
    author: author || existing?.author || 'Anonymous',
    allowScreenshots: draft.allowScreenshots ?? false,
    published: true,
    publishedAt: existing?.publishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updatedStories = existing
    ? stories.map((story) =>
        story.id === publishedStory.id ? publishedStory : story
      )
    : [publishedStory, ...stories]

  writeList(STORIES_KEY, updatedStories)

  // Remove the draft after successful publishing.
  writeList(
    DRAFTS_KEY,
    readList(DRAFTS_KEY).filter((item) => item.id !== draft.id)
  )

  window.dispatchEvent(new Event('moonlit-stories-updated'))

  return publishedStory
}

export function deletePublishedStory(id) {
  writeList(
    STORIES_KEY,
    getPublishedStories().filter((story) => story.id !== id)
  )

  window.dispatchEvent(new Event('moonlit-stories-updated'))
}
