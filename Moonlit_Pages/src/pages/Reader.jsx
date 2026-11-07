
import { useEffect, useState } from 'react'
import {
  Link,
  useParams,
  useOutletContext,
} from 'react-router-dom'
import { getStory } from '../api/stories.js'

const BOOKMARKS_KEY = 'moonlit_pages_bookmarks'
const OFFLINE_KEY = 'moonlit_pages_offline_stories'

// Read saved data from localStorage
function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

// Save data to localStorage
function saveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export default function Reader() {
  const { id: storyId } = useParams()

  // Get theme from Layout
  const outletContext = useOutletContext()
  const theme = outletContext?.theme || 'dark'
  const isDark = theme === 'dark'

  // Theme colours
  const colors = {
    page: isDark
      ? 'bg-[#10091F] text-[#F5EFFB]'
      : 'bg-[#F5EBDD] text-[#49372E]',

    heading: isDark
      ? 'text-[#FFFFFF]'
      : 'text-[#3D2C25]',

    muted: isDark
      ? 'text-[#D0C2E2]'
      : 'text-[#705B50]',

    accent: isDark
      ? 'text-[#D7B9FF]'
      : 'text-[#70458F]',

    link: isDark
      ? 'text-[#D7B9FF] hover:text-white'
      : 'text-[#70458F] hover:text-[#49372E]',

    card: isDark
      ? 'border-[#493565] bg-[#1B1230]'
      : 'border-[#D9C8B8] bg-[#FFF9F2]',

    header: isDark
      ? 'border-[#493565] bg-[#211535]'
      : 'border-[#D9C8B8] bg-[#FFF9F2]',

    content: isDark
      ? 'text-[#F3ECFA]'
      : 'text-[#49372E]',

    button: isDark
      ? 'border-[#70558F] bg-[#35234D] text-white hover:bg-[#493565]'
      : 'border-[#C9B3DE] bg-[#EDE1F5] text-[#49372E] hover:bg-[#E1D0ED]',

    secondaryButton: isDark
      ? 'border-[#70558F] text-[#E5D5F5] hover:bg-[#35234D]'
      : 'border-[#C9B3DE] text-[#49372E] hover:bg-[#EDE1F5]',

    divider: isDark
      ? 'border-[#493565]'
      : 'border-[#E3D2C2]',

    message: isDark
      ? 'text-[#D7B9FF]'
      : 'text-[#70458F]',
  }

  const [story, setStory] = useState(null)
  const [storyLoading, setStoryLoading] = useState(true)
  const [storyError, setStoryError] = useState('')

  const [bookmarks, setBookmarks] = useState(() =>
    readList(BOOKMARKS_KEY)
  )

  const [offlineStories, setOfflineStories] = useState(() =>
    readList(OFFLINE_KEY)
  )

  const [message, setMessage] = useState('')

  // Load story from Laravel API
  useEffect(() => {
    let isMounted = true

    async function loadStory() {
      try {
        setStoryLoading(true)
        setStoryError('')
        setStory(null)

        const result = await getStory(storyId)

        if (!isMounted) return

        setStory({
          ...result,
          coverImage: result.cover_image || '',
          allowScreenshots: Boolean(result.allow_screenshots),
          author: result.author || result.user?.name || 'Anonymous',
        })
      } catch (error) {
        console.error('Unable to load story:', error)

        if (!isMounted) return

        setStoryError(
          error.response?.status === 404
            ? 'This story could not be found or is no longer published.'
            : 'Unable to load this story. Please try again.'
        )
      } finally {
        if (isMounted) {
          setStoryLoading(false)
        }
      }
    }

    if (storyId) {
      loadStory()
    } else {
      setStory(null)
      setStoryLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [storyId])

  // Update bookmarks and offline stories when changed in another tab
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === BOOKMARKS_KEY || event.key === null) {
        setBookmarks(readList(BOOKMARKS_KEY))
      }

      if (event.key === OFFLINE_KEY || event.key === null) {
        setOfflineStories(readList(OFFLINE_KEY))
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Check whether story is bookmarked
  const isBookmarked = story
    ? bookmarks.some((item) =>
        typeof item === 'string'
          ? item === String(story.id)
          : String(item.id) === String(story.id)
      )
    : false

  // Check whether story is saved offline
  const isAvailableOffline = story
    ? offlineStories.some(
        (item) => String(item.id) === String(story.id)
      )
    : false

  // Add or remove bookmark
  function toggleBookmark() {
    if (!story) return

    try {
      const nextBookmarks = isBookmarked
        ? bookmarks.filter((item) =>
            typeof item === 'string'
              ? item !== String(story.id)
              : String(item.id) !== String(story.id)
          )
        : [...bookmarks, String(story.id)]

      saveList(BOOKMARKS_KEY, nextBookmarks)
      setBookmarks(nextBookmarks)

      setMessage(
        isBookmarked
          ? 'Removed from your library.'
          : 'Added to your library.'
      )
    } catch {
      setMessage('Could not update your library.')
    }
  }

  // Save story for offline access
  function saveForOffline() {
    if (!story) return

    try {
      const nextOfflineStories = [
        ...offlineStories.filter(
          (item) => String(item.id) !== String(story.id)
        ),
        {
          ...story,
          downloadedAt: new Date().toISOString(),
        },
      ]

      saveList(OFFLINE_KEY, nextOfflineStories)
      setOfflineStories(nextOfflineStories)

      setMessage('Story saved for offline access in this browser.')
    } catch {
      setMessage('Could not save this story for offline access.')
    }
  }

  // No story ID
  if (!storyId) {
    return (
      <div className={`mx-auto max-w-3xl py-16 text-center ${colors.page}`}>
        <div className="text-6xl">📖</div>

        <h1 className={`mt-5 text-3xl font-bold ${colors.heading}`}>
          Choose a story to read
        </h1>

        <p className={`mt-3 ${colors.muted}`}>
          Explore Moonlit Pages and find your next favorite story.
        </p>

        <Link
          to="/explore"
          className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Explore Stories
        </Link>
      </div>
    )
  }

  // Loading state
  if (storyLoading) {
    return (
      <div className={`mx-auto max-w-3xl py-16 text-center ${colors.page}`}>
        <p className={`text-lg ${colors.accent}`}>
          Loading story...
        </p>
      </div>
    )
  }

  // Error state
  if (storyError) {
    return (
      <div className={`mx-auto max-w-3xl py-16 text-center ${colors.page}`}>
        <div className="text-6xl">🌙</div>

        <h1 className={`mt-5 text-3xl font-bold ${colors.heading}`}>
          Unable to load story
        </h1>

        <p className="mt-3 text-red-500">
          {storyError}
        </p>

        <Link
          to="/explore"
          className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Back to Explore
        </Link>
      </div>
    )
  }

  // Story not found
  if (!story) {
    return (
      <div className={`mx-auto max-w-3xl py-16 text-center ${colors.page}`}>
        <div className="text-6xl">🌙</div>

        <h1 className={`mt-5 text-3xl font-bold ${colors.heading}`}>
          Story not found
        </h1>

        <p className={`mt-3 ${colors.muted}`}>
          This story may have been deleted or is no longer available.
        </p>

        <Link
          to="/explore"
          className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Back to Explore
        </Link>
      </div>
    )
  }

  return (
    <div className={`mx-auto w-full min-w-0 max-w-4xl space-y-6 pb-12 ${colors.page}`}>

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/explore"
          className={`text-sm font-semibold transition ${colors.link}`}
        >
          ← Back to Explore
        </Link>

        <Link
          to="/library"
          className={`text-sm font-semibold transition ${colors.link}`}
        >
          My Library →
        </Link>
      </div>

      {/* Story cover and information */}
      <header className={`overflow-hidden rounded-3xl border ${colors.header}`}>

        {/* Cover image */}
        <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-linear-to-br from-indigo-950 via-violet-900 to-purple-600 px-6 py-12">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.17),transparent_55%)]" />

          {story.coverImage ? (
            <img
              src={story.coverImage}
              alt={`${story.title} cover`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="relative text-8xl drop-shadow-lg">
              {story.emoji || '📖'}
            </span>
          )}

          <span className="absolute bottom-4 right-4 rounded-full border border-white/30 bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {story.genre || 'Other'}
          </span>
        </div>

        {/* Story details */}
        <div className="p-5 sm:p-8">

          <p className={`text-xs font-bold tracking-[0.25em] ${colors.accent}`}>
            MOONLIT PAGES READER
          </p>

          <h1 className={`mt-3 wrap-break-word text-3xl font-bold sm:text-4xl ${colors.heading}`}>
            {story.title}
          </h1>

          <p className={`mt-3 text-sm ${colors.muted}`}>
            Written by {story.author || 'Anonymous'}
          </p>

          {story.description && (
            <p className={`mt-5 text-sm leading-7 sm:text-base ${colors.content}`}>
              {story.description}
            </p>
          )}

          {/* Bookmark and offline buttons */}
          <div className="mt-6 flex flex-wrap gap-3">

            <button
              type="button"
              onClick={toggleBookmark}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${colors.button}`}
            >
              {isBookmarked
                ? '♥ Saved to Library'
                : '♡ Add to Library'}
            </button>

            <button
              type="button"
              onClick={saveForOffline}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${colors.secondaryButton}`}
            >
              {isAvailableOffline
                ? '✓ Saved Offline'
                : '↓ Save Offline'}
            </button>

          </div>

          {message && (
            <p
              aria-live="polite"
              className={`mt-4 text-sm font-semibold ${colors.message}`}
            >
              {message}
            </p>
          )}
        </div>
      </header>

      {/* Reading content */}
      <article className={`rounded-3xl border p-5 sm:p-10 ${colors.card}`}>

        {/* Chapter heading */}
        <div className={`mb-8 border-b pb-5 ${colors.divider}`}>
          <p className={`text-xs font-bold tracking-[0.2em] ${colors.accent}`}>
            BEGIN READING
          </p>

          <h2 className={`mt-3 text-2xl font-bold ${colors.heading}`}>
            {story.chapterTitle || 'Chapter 1'}
          </h2>
        </div>

        {/* Main story text */}
        <div className={`whitespace-pre-wrap wrap-break-word text-base font-normal leading-8 sm:text-lg sm:leading-9 ${colors.content}`}>
          {story.content?.trim()
            ? story.content
            : 'The author has not added any story content yet.'}
        </div>

        {/* End of story */}
        <div className={`mt-10 border-t pt-6 ${colors.divider}`}>
          <p className={`text-center text-sm font-medium ${colors.muted}`}>
            ✦ End of available content ✦
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">

            <button
              type="button"
              onClick={toggleBookmark}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${colors.secondaryButton}`}
            >
              {isBookmarked ? '♥ Saved' : '♡ Save this story'}
            </button>

            <Link
              to="/explore"
              className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Discover another story
            </Link>

          </div>
        </div>
      </article>

      {/* Screenshot preference */}
      <div className={`rounded-2xl border p-5 ${colors.card}`}>
        <p className={`text-sm font-semibold ${colors.heading}`}>
          Writer's screenshot preference:{' '}
          <span className={colors.accent}>
            {story.allowScreenshots
              ? 'Screenshots allowed'
              : 'Screenshots not allowed'}
          </span>
        </p>

        <p className={`mt-2 text-sm leading-6 ${colors.muted}`}>
          This displays the writer's preference. A website cannot reliably
          prevent screenshots taken by a device or operating system.
        </p>
      </div>

    </div>
  )
}
