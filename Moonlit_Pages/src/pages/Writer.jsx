
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

import {
  getMyStories,
  createStory,
  updateStory,
  deleteStory,
  publishStory,
} from '../api/stories.js'

import {
  getMyChapters,
  createChapter,
  updateChapter,
} from '../api/chapters.js'

export default function Writer() {
  const { theme } = useOutletContext() || {}
  const isLight = theme !== 'dark'

  const [stories, setStories] = useState([])
  const [storyId, setStoryId] = useState(null)
  const [storyStatus, setStoryStatus] = useState('draft')

  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('Fantasy')
  const [description, setDescription] = useState('')
  const [coverPhoto, setCoverPhoto] = useState('')

  const [chapters, setChapters] = useState([])
  const [chapterId, setChapterId] = useState(null)
  const [chapterTitle, setChapterTitle] = useState('Chapter 1: The Beginning')
  const [content, setContent] = useState('')

  const [allowScreenshots, setAllowScreenshots] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

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

  const publishedStories = stories.filter(
    (story) => story.status === 'published'
  )

  const draftStories = stories.filter(
    (story) => story.status === 'draft'
  )

  async function loadStories() {
    try {
      const data = await getMyStories()
      setStories(data.stories || [])
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Unable to load your stories. Please try again.'
      )
    }
  }

  useEffect(() => {
    loadStories()
  }, [])

  function startNewStory() {
    setStoryId(null)
    setStoryStatus('draft')
    setTitle('')
    setGenre('Fantasy')
    setDescription('')
    setCoverPhoto('')
    setChapters([])
    setChapterId(null)
    setChapterTitle('Chapter 1: The Beginning')
    setContent('')
    setAllowScreenshots(false)
    setMessage('')
  }

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
      setMessage('Unable to read this image.')
    }

    reader.readAsDataURL(file)
  }

  async function loadStory(story) {
    try {
      setMessage('')

      const loadedChapters = await getMyChapters(story.id)

      setStoryId(story.id)
      setStoryStatus(story.status)
      setTitle(story.title || '')
      setGenre(story.genre || 'Fantasy')
      setDescription(story.description || '')
      setCoverPhoto(story.cover_image || '')
      setAllowScreenshots(story.allow_screenshots ?? false)
      setChapters(loadedChapters)

      const firstChapter = loadedChapters[0]

      setChapterId(firstChapter?.id || null)
      setChapterTitle(
        firstChapter?.title || 'Chapter 1: The Beginning'
      )
      setContent(firstChapter?.content || '')

      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setMessage('Unable to load this story and its chapters.')
    }
  }

  function addNextChapter() {
    if (!storyId) {
      setMessage('Please save your story first.')
      return
    }

    const nextNumber =
      Math.max(
        0,
        ...chapters.map((chapter) =>
          Number(chapter.chapter_number) || 0
        )
      ) + 1

    setChapterId(null)
    setChapterTitle(`Chapter ${nextNumber}: New Chapter`)
    setContent('')
    setMessage('')
  }

  async function saveDraft(event) {
    event.preventDefault()

    if (!title.trim() || !chapterTitle.trim() || !content.trim()) {
      setMessage('Please enter a story title, chapter title and content.')
      return
    }

    if (saving) return
    setSaving(true)

    try {
      const storyData = {
        title: title.trim(),
        genre,
        description: description.trim(),
        cover_image: coverPhoto || null,
      }

      let savedStory

      if (storyId) {
        const response = await updateStory(storyId, storyData)
        savedStory = response.story
      } else {
        const response = await createStory(storyData)
        savedStory = response.story
        setStoryId(savedStory.id)
        setStoryStatus('draft')
      }

      // New chapters in published stories are published immediately.
      const chapterStatus =
        savedStory.status === 'published' ? 'published' : 'draft'

      const chapterData = {
        title: chapterTitle.trim(),
        content,
        status: chapterStatus,
      }

      if (chapterId) {
        await updateChapter(chapterId, chapterData)
      } else {
        const response = await createChapter(
          savedStory.id,
          chapterData
        )

        setChapterId(response.chapter.id)
      }

      const updatedChapters = await getMyChapters(savedStory.id)
      setChapters(updatedChapters)

      await loadStories()

      setMessage(
        chapterStatus === 'published'
          ? 'Your new chapter has been published successfully!'
          : 'Your story and chapter have been saved as a draft.'
      )
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Unable to save your chapter. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (!title.trim() || !chapterTitle.trim() || !content.trim()) {
      setMessage('Please enter a story title, chapter title and content.')
      return
    }

    if (saving) return
    setSaving(true)

    try {
      const storyData = {
        title: title.trim(),
        genre,
        description: description.trim(),
        cover_image: coverPhoto || null,
      }

      let savedStory

      if (storyId) {
        const response = await updateStory(storyId, storyData)
        savedStory = response.story
      } else {
        const response = await createStory(storyData)
        savedStory = response.story
      }

      const chapterData = {
        title: chapterTitle.trim(),
        content,
        status: 'published',
      }

      if (chapterId) {
        await updateChapter(chapterId, chapterData)
      } else {
        await createChapter(savedStory.id, chapterData)
      }

      if (savedStory.status !== 'published') {
        await publishStory(savedStory.id)
      }

      setStoryId(savedStory.id)
      setStoryStatus('published')

      const updatedChapters = await getMyChapters(savedStory.id)
      setChapters(updatedChapters)

      await loadStories()

      setChapterId(null)

      const nextNumber =
        Math.max(
          0,
          ...updatedChapters.map((chapter) =>
            Number(chapter.chapter_number) || 0
          )
        ) + 1

      setChapterTitle(`Chapter ${nextNumber}: New Chapter`)
      setContent('')

      setMessage(
        'Your chapter has been published successfully! You can add another chapter anytime.'
      )
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Unable to publish your chapter. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteStoryItem(id) {
    if (!window.confirm('Delete this story permanently?')) return

    try {
      await deleteStory(id)

      setStories((previous) =>
        previous.filter((story) => story.id !== id)
      )

      if (storyId === id) {
        startNewStory()
      } else {
        setMessage('Story deleted successfully.')
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        'Unable to delete this story.'
      )
    }
  }

  function renderStoryList(list, emptyMessage) {
    if (list.length === 0) {
      return (
        <div className={`rounded-xl border border-dashed px-4 py-6 text-center ${border}`}>
          <p className={`text-sm ${muted}`}>{emptyMessage}</p>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {list.map((story) => (
          <div
            key={story.id}
            className={`min-w-0 rounded-xl border p-3 ${softPanel}`}
          >
            {(story.cover_image || story.coverPhoto) && (
              <img
                src={story.cover_image || story.coverPhoto}
                alt={`${story.title} cover`}
                className="mb-3 h-28 w-full rounded-lg object-cover"
              />
            )}

            <p className="break-words font-semibold">
              {story.title}
            </p>

            <p className={`mt-1 text-xs ${muted}`}>
              {story.genre} · {story.status}
            </p>

            <div className="mt-3 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => loadStory(story)}
                className={`text-sm font-semibold ${accent} hover:underline`}
              >
                Edit / Manage
              </button>

              <button
                type="button"
                onClick={() => deleteStoryItem(story.id)}
                className="text-sm font-semibold text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${page}`}>
      <div className="mx-auto max-w-7xl">

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
                    {storyId ? 'Manage Your Story' : 'Create a New Story'}
                  </h2>

                  <p className={`mt-2 text-sm ${muted}`}>
                    {storyStatus === 'published'
                      ? 'You can continue adding chapters to this published story.'
                      : 'Your work is saved securely to your account.'}
                  </p>
                </div>

                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${softPanel}`}>
                  {storyStatus === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>
            </div>

            <form onSubmit={saveDraft} className="space-y-6 p-5 sm:p-8">

              <div>
                <label htmlFor="story-title" className="mb-2 block text-sm font-semibold">
                  Story Title *
                </label>

                <input
                  id="story-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={120}
                  placeholder="Give your story a memorable title..."
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${input}`}
                  required
                />
              </div>

              <div>
                <label htmlFor="story-genre" className="mb-2 block text-sm font-semibold">
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

              <div>
                <label htmlFor="story-description" className="mb-2 block text-sm font-semibold">
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
                <label htmlFor="cover-photo" className="mb-3 block text-sm font-semibold">
                  Story Cover Photo
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
                  className={`block w-full rounded-xl border p-3 text-sm ${input}`}
                />

                <p className={`mt-2 text-xs ${muted}`}>
                  Maximum size: 1 MB.
                </p>

                {coverPhoto && (
                  <button
                    type="button"
                    onClick={() => setCoverPhoto('')}
                    className="mt-3 text-sm font-medium text-red-500 hover:underline"
                  >
                    Remove Cover Photo
                  </button>
                )}
              </div>

              {/* Screenshot Preference */}
              <div className={`rounded-2xl border p-4 ${softPanel}`}>
                <label htmlFor="allow-screenshots" className="flex cursor-pointer items-start gap-3">
                  <input
                    id="allow-screenshots"
                    type="checkbox"
                    checked={allowScreenshots}
                    onChange={(event) => setAllowScreenshots(event.target.checked)}
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

              {/* Chapters */}
              {storyId && (
                <div className={`rounded-2xl border p-5 ${softPanel}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold">Story Chapters</h3>

                    <span className={`text-xs ${muted}`}>
                      {chapters.length} chapters
                    </span>
                  </div>

                  <div className="space-y-2">
                    {chapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        type="button"
                        onClick={() => {
                          setChapterId(chapter.id)
                          setChapterTitle(chapter.title)
                          setContent(chapter.content)
                          setMessage('')
                        }}
                        className={`w-full rounded-xl border p-3 text-left ${border} hover:opacity-75`}
                      >
                        <p className="font-semibold">
                          Chapter {chapter.chapter_number}: {chapter.title}
                        </p>

                        <p className={`mt-1 text-xs ${muted}`}>
                          {chapter.status}
                        </p>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addNextChapter}
                    className={`mt-4 w-full rounded-xl px-4 py-3 font-semibold ${primaryButton}`}
                  >
                    + Add Next Chapter
                  </button>
                </div>
              )}

              {/* Chapter Title */}
              <div>
                <label htmlFor="chapter-title" className="mb-2 block text-sm font-semibold">
                  Chapter Title *
                </label>

                <input
                  id="chapter-title"
                  value={chapterTitle}
                  onChange={(event) => setChapterTitle(event.target.value)}
                  maxLength={255}
                  placeholder="Enter your chapter title..."
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${input}`}
                  required
                />
              </div>

              {/* Chapter Content */}
              <div>
                <label htmlFor="chapter-content" className="mb-2 block text-sm font-semibold">
                  Chapter Content *
                </label>

                <textarea
                  id="chapter-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={16}
                  placeholder="Start writing your chapter here..."
                  className={`w-full resize-y rounded-xl border px-4 py-4 leading-7 outline-none ${input}`}
                  required
                />

                <p className={`mt-2 text-xs ${muted}`}>
                  {content.trim()
                    ? content.trim().split(/\s+/).length
                    : 0} words
                </p>
              </div>

              {/* Buttons */}
              <div className={`flex flex-wrap gap-3 border-t pt-5 ${border}`}>
                <button
                  type="submit"
                  disabled={saving}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold transition ${primaryButton} disabled:opacity-50`}
                >
                  {saving
                    ? 'Saving...'
                    : storyStatus === 'published'
                      ? 'Publish Chapter'
                      : storyId
                        ? 'Update Draft'
                        : 'Save Draft'}
                </button>

                {storyStatus !== 'published' && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={saving}
                    className={`rounded-xl border px-5 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                      isLight
                        ? 'border-[#E7D9C9] bg-[#EAD2B9] text-[#49372E]'
                        : 'border-[#49385F] bg-[#49336F] text-[#F5EFFB]'
                    }`}
                  >
                    {saving ? 'Publishing...' : 'Publish Story'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={startNewStory}
                  className={`rounded-xl border px-5 py-3 text-sm font-semibold ${border} hover:opacity-75`}
                >
                  Clear Editor
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
                <p className={`text-sm ${muted}`}>Published Stories</p>
                <p className={`mt-1 text-3xl font-bold ${accent}`}>
                  {publishedStories.length}
                </p>
              </div>

              <div className={`mt-3 rounded-xl border p-4 ${softPanel}`}>
                <p className={`text-sm ${muted}`}>Saved Drafts</p>
                <p className={`mt-1 text-3xl font-bold ${accent}`}>
                  {draftStories.length}
                </p>
              </div>
            </section>

            {/* Published Stories */}
            <section className={`rounded-2xl border p-5 ${panel}`}>
              <h2 className="mb-4 text-lg font-bold">
                Published Stories
              </h2>

              {renderStoryList(
                publishedStories,
                'Your published stories will appear here.'
              )}
            </section>

            {/* Drafts */}
            <section className={`rounded-2xl border p-5 ${panel}`}>
              <h2 className="mb-4 text-lg font-bold">
                My Drafts
              </h2>

              {renderStoryList(
                draftStories,
                'Your saved drafts will appear here.'
              )}
            </section>

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
