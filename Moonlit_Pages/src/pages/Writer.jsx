import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  getMyStories,
  createStory,
  updateStory,
  deleteStory,
} from '../api/stories.js'


export default function Writer() {
  const { theme } = useOutletContext() || {}
  const isLight = theme !== 'dark'
  const [drafts, setDrafts] = useState([])
  const [storyId, setStoryId] = useState(null)
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('Fantasy')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [coverPhoto, setCoverPhoto] = useState('')
  const [allowScreenshots, setAllowScreenshots] = useState(false)
  const [message, setMessage] = useState('')

  // Match Profile.jsx theme
  const page = isLight ? 'text-[#49372E]' : 'text-[#F5EFFB]'
  const muted = isLight ? 'text-[#88796F]' : 'text-[#B9ADC9]'

  const panel = isLight
    ? 'border-[#E7D9C9] bg-[#FFF9F1]'
    : 'border-[#3A2D50] bg-[#25183D]'

  const border = isLight
    ? 'border-[#E7D9C9]'
    : 'border-[#3A2D50]'

  const input = isLight
    ? 'border-[#E7D9C9] bg-[#FFFDF9] text-[#49372E] placeholder:text-[#A89A8F] focus:border-[#A66B50]'
    : 'border-[#49385F] bg-[#170F27] text-[#F5EFFB] placeholder:text-[#88799B] focus:border-[#A78BFA]'

  const accent = isLight ? 'text-[#A66B50]' : 'text-[#D6B779]'

  const primaryButton = isLight
    ? 'bg-[#A66B50] text-white hover:bg-[#89543F]'
    : 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'

  const softPanel = isLight
    ? 'border-[#E7D9C9] bg-[#F5EBDD]'
    : 'border-[#49385F] bg-[#1B1230]'

  const editorBackground = isLight
    ? 'bg-[#FFF9F1]'
    : 'bg-[#25183D]'

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await getMyStories()

        const savedDrafts = data
          .filter((story) => story.status === 'draft')
          .map((story) => ({
            ...story,
            coverPhoto: story.cover_image || '',
            allowScreenshots: story.allow_screenshots ?? false,
            updatedAt: story.updated_at,
          }))

        setDrafts(savedDrafts)
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
          'Unable to load your stories. Please try again.'
        )
      }
    }

    loadStories()
  }, [])

  function handleCoverUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file.')
      event.target.value = ''
      return
    }

    if (file.size > 1024 * 1024) {
      setMessage('Cover photo must be smaller than 1 MB.')
      event.target.value = ''
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setCoverPhoto(String(reader.result || ''))
      setMessage('Cover photo uploaded successfully.')
    }

    reader.onerror = () => {
      setMessage('Unable to read this image. Please try another one.')
    }

    reader.readAsDataURL(file)
  }

    async function saveDraft(event) {
    event.preventDefault()

    if (!title.trim() || !content.trim()) {
      setMessage('Please enter a story title and story content.')
      return
    }

    const storyData = {
      title: title.trim(),
      genre,
      description: description.trim(),
      content,
      cover_image: coverPhoto || null,
      allow_screenshots: allowScreenshots,
      status: 'draft',
    }

    try {
      let response

      if (storyId) {
        response = await updateStory(storyId, storyData)
        setMessage('Your draft has been updated.')
      } else {
        response = await createStory(storyData)
        setStoryId(response.story.id)
        setMessage('Your story has been saved as a draft.')
      }

      const savedStory = response.story

      setDrafts((previous) => [
        {
          ...savedStory,
          coverPhoto: savedStory.cover_image || '',
          allowScreenshots: savedStory.allow_screenshots ?? false,
          updatedAt: savedStory.updated_at,
        },
        ...previous.filter((draft) => draft.id !== savedStory.id),
      ])
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Unable to save your draft. Please try again.'
      )
    }
  }

  function startNewStory() {
  setStoryId(null)
  setTitle('')
  setGenre('Fantasy')
  setDescription('')
  setContent('')
  setCoverPhoto('')
  setAllowScreenshots(false)
  setMessage('')
  }

  function editDraft(draft) {
    setStoryId(draft.id)
    setTitle(draft.title || '')
    setGenre(draft.genre || 'Fantasy')
    setDescription(draft.description || '')
    setContent(draft.content || '')
    setCoverPhoto(draft.coverPhoto || '')
    setAllowScreenshots(draft.allowScreenshots ?? false)
    setMessage('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function deleteDraft(id) {
    if (!window.confirm('Delete this draft permanently?')) return

    try {
      await deleteStory(id)

      setDrafts((previous) =>
        previous.filter((draft) => draft.id !== id)
      )

      if (storyId === id) {
        startNewStory()
      } else {
        setMessage('Draft deleted.')
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Unable to delete this draft. Please try again.'
      )
    }
  }

  async function handlePublish() {
  if (!title.trim() || !content.trim()) {
    setMessage('Please enter a story title and story content.')
    return
  }

  const storyData = {
    title: title.trim(),
    genre,
    description: description.trim(),
    content,
    cover_image: coverPhoto || null,
    allow_screenshots: allowScreenshots,
    status: 'published',
  }

  try {
    if (storyId) {
      await updateStory(storyId, storyData)
    } else {
      await createStory(storyData)
    }

    setDrafts((previous) =>
      previous.filter((draft) => draft.id !== storyId)
    )

    startNewStory()
    setMessage('Your story has been published successfully!')
  } catch (error) {
    setMessage(
      error.response?.data?.message ||
      'Unable to publish your story. Please try again.'
    )
  }
}

  return (
    <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${page}`}>
      <div className="mx-auto max-w-7xl">

        {/* Page Header */}
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${accent}`}>
              Your personal writing space
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Writer Studio
            </h1>

            <p className={`mt-3 text-sm sm:text-base ${muted}`}>
              Every unforgettable story begins with a single sentence.
            </p>
          </div>

          <button
            type="button"
            onClick={startNewStory}
            className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${primaryButton}`}
          >
            + New Story
          </button>
        </header>

        {message && (
          <div
            aria-live="polite"
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${panel}`}
          >
            {message}
          </div>
        )}

        <div className="grid min-w-0 gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">

          {/* Story Editor */}
          <section className={`min-w-0 overflow-hidden rounded-3xl border ${panel}`}>
            <div className={`border-b px-5 py-6 sm:px-8 ${border} ${editorBackground}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">
                    {storyId ? 'Edit Your Story' : 'Create a New Story'}
                  </h2>

                  <p className={`mt-2 text-sm ${muted}`}>
                    Your work is saved securely to your account.
                  </p>
                </div>

                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${softPanel}`}>
                  Draft
                </span>
              </div>
            </div>

            <form onSubmit={saveDraft} className="space-y-6 p-5 sm:p-8">

              {/* Story Title */}
              <div>
                <label
                  htmlFor="story-title"
                  className="mb-2 block text-sm font-semibold"
                >
                  Story Title *
                </label>

                <input
                  id="story-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  placeholder="Give your story a memorable title..."
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition ${input}`}
                  required
                />
              </div>

              {/* Genre */}
              <div>
                <label
                  htmlFor="story-genre"
                  className="mb-2 block text-sm font-semibold"
                >
                  Genre
                </label>

                <select
                  id="story-genre"
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${input}`}
                >
                  {[
                    'Fantasy',
                    'Romance',
                    'Mystery',
                    'Thriller',
                    'Horror',
                    'Adventure',
                    'Science Fiction',
                    'Drama',
                    'Other',
                  ].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="story-description"
                  className="mb-2 block text-sm font-semibold"
                >
                  Short Description
                </label>

                <textarea
                  id="story-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="What is your story about?"
                  className={`w-full resize-y rounded-xl border px-4 py-3 outline-none ${input}`}
                />

                <p className={`mt-1 text-right text-xs ${muted}`}>
                  {description.length}/500
                </p>
              </div>

              {/* Cover Photo */}
              <div className={`rounded-2xl border p-5 ${softPanel}`}>
                <label
                  htmlFor="cover-photo"
                  className="mb-3 block text-sm font-semibold"
                >
                  🖼️ Story Cover Photo
                </label>

                {coverPhoto && (
                  <img
                    src={coverPhoto}
                    alt="Story cover preview"
                    className="mb-4 h-48 w-full rounded-xl object-cover"
                  />
                )}

                <input
                  id="cover-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className={`block w-full rounded-xl border p-3 text-sm ${
                    isLight
                      ? 'border-[#E7D9C9] bg-[#FFFDF9] text-[#49372E] file:mr-3 file:rounded-lg file:border-0 file:bg-[#A66B50] file:px-4 file:py-2 file:font-medium file:text-white'
                      : 'border-[#49385F] bg-[#170F27] text-[#F5EFFB] file:mr-3 file:rounded-lg file:border-0 file:bg-[#8B6CCF] file:px-4 file:py-2 file:font-medium file:text-white'
                  }`}
                />

                <p className={`mt-2 text-xs ${muted}`}>
                  Choose an image from your device. Maximum size: 1 MB.
                </p>

                {coverPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPhoto('')
                      setMessage('Cover photo removed.')
                    }}
                    className="mt-3 text-sm font-medium text-red-500 hover:underline"
                  >
                    Remove Cover Photo
                  </button>
                )}
              </div>

              {/* Screenshot Preference */}
              <div className={`rounded-2xl border p-4 ${softPanel}`}>
                <label
                  htmlFor="allow-screenshots"
                  className="flex cursor-pointer items-start gap-3"
                >
                  <input
                    id="allow-screenshots"
                    type="checkbox"
                    checked={allowScreenshots}
                    onChange={(event) =>
                      setAllowScreenshots(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-violet-500"
                  />

                  <span>
                    <span className="block text-sm font-semibold">
                      Allow Screenshots
                    </span>

                    <span className={`mt-1 block text-xs leading-5 ${muted}`}>
                      This saves your preference but cannot technically block screenshots.
                    </span>
                  </span>
                </label>
              </div>

              {/* Story Content */}
              <div>
                <label
                  htmlFor="story-content"
                  className="mb-2 block text-sm font-semibold"
                >
                  Story Content *
                </label>

                <textarea
                  id="story-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={16}
                  placeholder={'Chapter 1: The Beginning\n\nWrite your story here...'}
                  className={`w-full resize-y rounded-xl border px-4 py-4 leading-7 outline-none ${input}`}
                  required
                />

                <p className={`mt-2 text-xs ${muted}`}>
                  {content.trim()
                    ? content.trim().split(/\s+/).length
                    : 0}{' '}
                  words
                </p>
              </div>

              {/* Form Buttons */}
              <div className={`flex flex-wrap gap-3 border-t pt-5 ${border}`}>
                <button
                  type="submit"
                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${primaryButton}`}
                >
                  {storyId ? 'Update Draft' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  onClick={startNewStory}
                  className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${border} hover:opacity-75`}
                >
                  Clear Editor
                </button>

                <button
                  type="button"
                  onClick={handlePublish}
                  className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                    isLight
                      ? 'border-[#E7D9C9] bg-[#EAD2B9] text-[#49372E] hover:bg-[#DFC1A2]'
                      : 'border-[#49385F] bg-[#49336F] text-[#F5EFFB] hover:bg-[#5B4387]'
                  }`}
                >
                  ✨ Publish Story
                </button>
              </div>
            </form>
          </section>

          {/* Sidebar */}
          <aside className="min-w-0 space-y-5">

            {/* Writing Journey */}
            <section className={`rounded-2xl border p-5 ${panel}`}>
              <div className="text-3xl">🌙</div>

              <h2 className="mt-3 text-lg font-bold">
                Your Writing Journey
              </h2>

              <p className={`mt-2 text-sm leading-6 ${muted}`}>
                Develop your characters, explore new ideas, and let your imagination grow one chapter at a time.
              </p>

              <div className={`mt-5 rounded-xl border p-4 ${softPanel}`}>
                <p className={`text-sm ${muted}`}>Saved Drafts</p>
                <p className={`mt-1 text-3xl font-bold ${accent}`}>
                  {drafts.length}
                </p>
              </div>
            </section>

            {/* Draft List */}
            <section className={`rounded-2xl border p-5 ${panel}`}>
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold">My Drafts</h2>

                <span className={`text-xs ${muted}`}>
                  {drafts.length} saved
                </span>
              </div>

              {drafts.length === 0 ? (
                <div className={`rounded-xl border border-dashed px-4 py-8 text-center ${border}`}>
                  <span className="text-3xl">📖</span>

                  <p className={`mt-3 text-sm ${muted}`}>
                    Your saved drafts will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <div
                      key={draft.id}
                      className={`min-w-0 rounded-xl border p-3 ${softPanel}`}
                    >
                      {draft.coverPhoto && (
                        <img
                          src={draft.coverPhoto}
                          alt={`${draft.title} cover`}
                          className="mb-3 h-28 w-full rounded-lg object-cover"
                        />
                      )}

                      <p className="break-words font-semibold">
                        {draft.title}
                      </p>

                      <p className={`mt-1 text-xs ${muted}`}>
                        {draft.genre} ·{' '}
                        {draft.updatedAt
                          ? new Date(draft.updatedAt).toLocaleDateString()
                          : 'Not dated'}
                      </p>

                      <p className={`mt-2 text-xs ${muted}`}>
                        Screenshots:{' '}
                        {draft.allowScreenshots ? 'Allowed' : 'Not allowed'}
                      </p>

                      <div className="mt-3 flex gap-4">
                        <button
                          type="button"
                          onClick={() => editDraft(draft)}
                          className={`text-sm font-semibold ${accent} hover:underline`}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteDraft(draft.id)}
                          className="text-sm font-semibold text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Explore Link */}
            <Link
              to="/explore"
              className={`block rounded-xl border px-4 py-3 text-center text-sm font-semibold transition ${border} hover:opacity-75`}
            >
              ← Back to Explore Stories
            </Link>
          </aside>
        </div>
      </div>
    </main>
  )
}