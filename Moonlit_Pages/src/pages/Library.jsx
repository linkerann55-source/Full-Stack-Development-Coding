
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { getStories } from '../api/stories.js'

const BOOKMARKS_KEY = 'moonlit_pages_bookmarks'
const HISTORY_KEY = 'moonlit_pages_reading_history'

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function saveList(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('Unable to save library:', error)
    return false
  }
}

function extractStories(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.stories)) return result.stories
  if (Array.isArray(result?.data?.stories)) return result.data.stories
  if (Array.isArray(result?.data)) return result.data
  return []
}

function normalizeStory(story) {
  return {
    ...story,
    id: story.id,
    title: story.title || 'Untitled Story',
    author:
      typeof story.author === 'object'
        ? story.author?.name || story.user?.name || 'Anonymous'
        : story.author || story.authorName || story.user?.name || 'Anonymous',
    genre: story.genre || 'Other',
    coverImage: story.coverImage || story.cover_image || '',
    emoji: story.emoji || '📖',
  }
}

function normalizeBookmark(item, allStories) {
  const id = typeof item === 'object' && item !== null
    ? item.id
    : item

  const existingStory = allStories.find(
    (story) => String(story.id) === String(id)
  )

  if (existingStory) {
    return normalizeStory({
      ...(typeof item === 'object' && item !== null ? item : {}),
      ...existingStory,
    })
  }

  return typeof item === 'object' && item !== null
    ? normalizeStory(item)
    : null
}

function StoryCard({
  story,
  label,
  onRemove,
  isDark,
  targetChapterId,
  lastRead,
}) {
  const progressKey = `moonlit_pages_progress_${story.id}`
  const savedProgress = localStorage.getItem(progressKey)

  const hasProgress =
    savedProgress !== null ||
    Boolean(lastRead?.chapter_id)

  const chapterNumber = lastRead?.chapter_number ??
    (savedProgress !== null ? Number(savedProgress) + 1 : null)

  const readerLink = targetChapterId
    ? `/reader/${story.id}/${targetChapterId}`
    : `/reader/${story.id}`

  const colors = {
    panel: isDark
      ? 'border-[#3A2D50] bg-[#1A122B]'
      : 'border-[#E7D9C9] bg-[#FFF9F1]',

    heading: isDark ? 'text-[#F5EFFB]' : 'text-[#49372E]',
    muted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    accent: isDark ? 'text-[#D6B779]' : 'text-[#A66B50]',

    border: isDark ? 'border-[#3A2D50]' : 'border-[#E7D9C9]',

    cover: isDark
      ? 'bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
      : 'bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',

    genre: isDark
      ? 'border-[#8B6CCF]/40 bg-[#25183D] text-[#D6B779]'
      : 'border-[#E7D9C9] bg-[#F5EBDD] text-[#A66B50]',

    button: isDark
      ? 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'
      : 'bg-[#A66B50] text-white hover:bg-[#89543F]',

    remove: isDark
      ? 'border-red-400/25 text-red-300 hover:bg-red-400/10'
      : 'border-red-300 text-red-700 hover:bg-red-50',
  }

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-xl ${colors.panel} ${
        isDark
          ? 'hover:border-[#8B6CCF]/60 hover:shadow-[#8B6CCF]/10'
          : 'hover:border-[#C79A7B] hover:shadow-[#A66B50]/10'
      }`}
    >
      {/* Cover */}
      <div className={`relative flex min-h-40 items-center justify-center overflow-hidden ${colors.cover}`}>
        <span className="absolute left-8 top-5 text-sm opacity-50">✦</span>
        <span className="absolute right-8 top-8 text-lg opacity-50">✧</span>
        <span className="absolute bottom-5 left-12 text-lg opacity-50">✧</span>
        <span className="absolute bottom-5 right-10 text-sm opacity-50">✦</span>

        {story.coverImage ? (
          <img
            src={story.coverImage}
            alt={`${story.title} cover`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="relative text-6xl transition duration-300 group-hover:scale-110">
            {story.emoji || '📖'}
          </span>
        )}
      </div>

      {/* Information */}
      <div className="flex flex-1 flex-col p-5">
        <div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${colors.genre}`}>
            {story.genre || 'General'}
          </span>
        </div>

        <h3 className={`mt-4 line-clamp-2 text-lg font-bold ${colors.heading}`}>
          {story.title || 'Untitled Story'}
        </h3>

        <p className={`mt-1 text-sm ${colors.accent}`}>
          By {story.author || 'Anonymous'}
        </p>

        {hasProgress && (
          <p className={`mt-2 text-xs font-semibold ${colors.accent}`}>
            Last read: {lastRead?.chapter_title || `Chapter ${chapterNumber}`}
          </p>
        )}

        {story.description && (
          <p className={`mt-3 line-clamp-3 flex-1 text-sm leading-6 ${colors.muted}`}>
            {story.description}
          </p>
        )}

        {!story.description && <div className="flex-1" />}

        {lastRead?.last_read_at && (
          <p className={`mt-3 text-xs ${colors.muted}`}>
            Last opened: {new Date(lastRead.last_read_at).toLocaleString()}
          </p>
        )}

        <div className={`mt-5 flex gap-2 border-t pt-4 ${colors.border}`}>
          <Link
            to={readerLink}
            state={{ story }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${colors.button}`}
          >
            {hasProgress ? 'Continue Reading →' : 'Read Story →'}
          </Link>

          <button
            type="button"
            onClick={() => onRemove(story.id)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${colors.remove}`}
            aria-label={`Remove ${story.title} from ${label}`}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  )
}

function EmptyState({
  emoji,
  title,
  description,
  link,
  linkText,
  isDark,
}) {
  const colors = {
    section: isDark
      ? 'border-[#3A2D50] bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
      : 'border-[#E7D9C9] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',

    heading: isDark ? 'text-[#F5EFFB]' : 'text-[#49372E]',
    muted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',

    button: isDark
      ? 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'
      : 'bg-[#A66B50] text-white hover:bg-[#89543F]',
  }

  return (
    <div className={`rounded-3xl border px-6 py-12 text-center ${colors.section}`}>
      <div className="text-5xl">{emoji}</div>

      <h3 className={`mt-5 text-xl font-bold ${colors.heading}`}>
        {title}
      </h3>

      <p className={`mx-auto mt-3 max-w-md text-sm leading-6 ${colors.muted}`}>
        {description}
      </p>

      <Link
        to={link}
        className={`mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold transition ${colors.button}`}
      >
        {linkText}
      </Link>
    </div>
  )
}

export default function Library() {
  const outletContext = useOutletContext() || {}
  const theme = outletContext.theme || 'dark'
  const isDark = theme === 'dark'

  const [bookmarks, setBookmarks] = useState([])
  const [readingHistory, setReadingHistory] = useState([])
  const [publishedStories, setPublishedStories] = useState([])
  const [activeTab, setActiveTab] = useState('saved')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const colors = {
    page: isDark
      ? 'bg-[#10091F] text-[#F5EFFB]'
      : 'bg-[#F5EBDD] text-[#49372E]',

    heading: isDark ? 'text-[#F5EFFB]' : 'text-[#49372E]',
    muted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    accent: isDark ? 'text-[#D6B779]' : 'text-[#A66B50]',

    border: isDark ? 'border-[#3A2D50]' : 'border-[#E7D9C9]',

    panel: isDark
      ? 'border-[#3A2D50] bg-[#1A122B]'
      : 'border-[#E7D9C9] bg-[#FFF9F1]',

    section: isDark
      ? 'border-[#3A2D50] bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
      : 'border-[#E7D9C9] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',

    activeTab: isDark
      ? 'border-[#8B6CCF] bg-[#25183D] text-[#D6B779]'
      : 'border-[#A66B50] bg-[#F0E3D4] text-[#A66B50]',

    inactiveTab: isDark
      ? 'border-[#3A2D50] bg-[#1A122B] text-[#B9ADC9] hover:bg-[#25183D]'
      : 'border-[#E7D9C9] bg-[#FFF9F1] text-[#88796F] hover:bg-[#F0E3D4]',
  }

  // Load library data
  const loadLibrary = useCallback(async () => {
    setBookmarks(readList(BOOKMARKS_KEY))
    setReadingHistory(readList(HISTORY_KEY))

    try {
      setLoading(true)
      setError('')

      const result = await getStories()
      const stories = extractStories(result)

      setPublishedStories(stories.map(normalizeStory))
    } catch (error) {
      console.error('Unable to load library stories:', error)
      setPublishedStories([])
      setError('Unable to load published stories. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLibrary()

    function handleStorage(event) {
      if (
        event.key === null ||
        event.key === BOOKMARKS_KEY ||
        event.key === HISTORY_KEY
      ) {
        setBookmarks(readList(BOOKMARKS_KEY))
        setReadingHistory(readList(HISTORY_KEY))
      }
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('moonlit-stories-updated', loadLibrary)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('moonlit-stories-updated', loadLibrary)
    }
  }, [loadLibrary])

  // Saved stories
  const savedStories = useMemo(() => {
    return bookmarks
      .map((item) => normalizeBookmark(item, publishedStories))
      .filter(Boolean)
      .filter(
        (story, index, array) =>
          array.findIndex(
            (item) => String(item.id) === String(story.id)
          ) === index
      )
  }, [bookmarks, publishedStories])

  // Reading history
  const uniqueHistory = useMemo(() => {
    return [...readingHistory]
      .filter((item) => item && item.id)
      .sort((a, b) => {
        return new Date(b.last_read_at || 0) -
          new Date(a.last_read_at || 0)
      })
      .filter(
        (item, index, array) =>
          array.findIndex(
            (other) => String(other.id) === String(item.id)
          ) === index
      )
  }, [readingHistory])

  // Match history with story information
  const historyStories = useMemo(() => {
    return uniqueHistory.map((history) => {
      const publishedStory = publishedStories.find(
        (story) => String(story.id) === String(history.id)
      )

      return {
        ...normalizeStory({
          ...(publishedStory || {}),
          ...history,
          coverImage:
            publishedStory?.coverImage ||
            history.cover_image ||
            '',
        }),
        chapter_id: history.chapter_id,
        chapter_title: history.chapter_title,
        chapter_number: history.chapter_number,
        last_read_at: history.last_read_at,
      }
    })
  }, [uniqueHistory, publishedStories])

  // Remove bookmark
  function removeBookmark(id) {
    const updated = bookmarks.filter((item) => {
      const itemId =
        typeof item === 'object' && item !== null
          ? item.id
          : item

      return String(itemId) !== String(id)
    })

    if (saveList(BOOKMARKS_KEY, updated)) {
      setBookmarks(updated)
    }
  }

  // Remove reading history
  function removeHistory(id) {
    const updated = readingHistory.filter(
      (item) => String(item?.id) !== String(id)
    )

    if (saveList(HISTORY_KEY, updated)) {
      setReadingHistory(updated)
    }
  }

  // Clear reading history
  function clearHistory() {
    if (readingHistory.length === 0) return

    const confirmed = window.confirm(
      'Are you sure you want to clear your reading history?'
    )

    if (!confirmed) return

    if (saveList(HISTORY_KEY, [])) {
      setReadingHistory([])
    }
  }

  const displayedStories =
    activeTab === 'saved'
      ? savedStories
      : historyStories

  const tabInfo = {
    saved: {
      title: 'Your Saved Stories',
      description: 'All the stories you have bookmarked in one place.',
      emptyTitle: 'Your library is waiting',
      emptyDescription: 'Discover stories you love and bookmark them to keep them in your personal library.',
      emoji: '🌙',
    },
    history: {
      title: 'Your Reading History',
      description: 'Return to the stories and chapters you have recently read.',
      emptyTitle: 'No reading history yet',
      emptyDescription: 'Start reading a story and your recent reading activity will appear here.',
      emoji: '🕰️',
    },
  }

  const currentTab = tabInfo[activeTab]

  return (
    <main className={`min-h-screen px-4 py-8 transition-colors duration-300 sm:px-6 lg:px-10 ${colors.page}`}>
      <div className="mx-auto max-w-7xl">

        {/* Page heading */}
        <header className="mb-8">
          <p className={`text-sm font-semibold uppercase tracking-[0.25em] ${colors.accent}`}>
            YOUR PERSONAL READING SPACE
          </p>

          <h1 className={`mt-3 text-3xl font-bold sm:text-4xl ${colors.heading}`}>
            My Library
            <span className={`ml-3 ${colors.accent}`}>✦</span>
          </h1>

          <p className={`mt-3 max-w-2xl leading-7 ${colors.muted}`}>
            Keep your favourite stories close and return to the worlds
            you love, whenever you want.
          </p>
        </header>

        {/* Summary */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={`rounded-2xl border p-5 sm:p-6 ${colors.panel}`}>
            <p className={`text-sm ${colors.muted}`}>Saved Stories</p>
            <p className={`mt-2 text-3xl font-bold ${colors.heading}`}>
              {savedStories.length}
            </p>
            <p className={`mt-1 text-xs ${colors.accent}`}>Bookmarked stories</p>
          </div>

          <div className={`rounded-2xl border p-5 sm:p-6 ${colors.panel}`}>
            <p className={`text-sm ${colors.muted}`}>Reading History</p>
            <p className={`mt-2 text-3xl font-bold ${colors.heading}`}>
              {uniqueHistory.length}
            </p>
            <p className={`mt-1 text-xs ${colors.accent}`}>Recently read stories</p>
          </div>
        </section>

        {/* Tabs */}
        <section className="mb-7">
          <div className={`flex flex-wrap gap-3 border-b pb-4 ${colors.border}`}>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                activeTab === 'saved'
                  ? colors.activeTab
                  : colors.inactiveTab
              }`}
            >
              ♡ Saved ({savedStories.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                activeTab === 'history'
                  ? colors.activeTab
                  : colors.inactiveTab
              }`}
            >
              🕰️ History ({uniqueHistory.length})
            </button>
          </div>
        </section>

        {/* Section heading */}
        <section className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className={`text-2xl font-bold ${colors.heading}`}>
              {currentTab.title}
            </h2>

            <p className={`mt-2 text-sm ${colors.muted}`}>
              {currentTab.description}
            </p>
          </div>

          {activeTab === 'history' && uniqueHistory.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-xl border border-red-400/40 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-500/10"
            >
              Clear History
            </button>
          )}
        </section>

        {/* Loading */}
        {loading && activeTab === 'saved' ? (
          <div className={`py-12 text-center ${colors.accent}`}>
            Loading your library...
          </div>
        ) : error && activeTab === 'saved' && savedStories.length === 0 ? (
          <div className="rounded-2xl border border-red-400/30 p-6 text-center">
            <p className="text-sm text-red-500">{error}</p>

            <button
              type="button"
              onClick={loadLibrary}
              className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : displayedStories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedStories.map((story) => (
              <StoryCard
                key={`${activeTab}-${story.id}`}
                story={story}
                label={
                  activeTab === 'saved'
                    ? 'saved stories'
                    : 'reading history'
                }
                onRemove={
                  activeTab === 'saved'
                    ? removeBookmark
                    : removeHistory
                }
                isDark={isDark}
                targetChapterId={
                  activeTab === 'history'
                    ? story.chapter_id
                    : null
                }
                lastRead={
                  activeTab === 'history'
                    ? story
                    : null
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji={currentTab.emoji}
            title={currentTab.emptyTitle}
            description={currentTab.emptyDescription}
            link="/explore"
            linkText="Explore Stories"
            isDark={isDark}
          />
        )}

        {/* Bottom banner */}
        <section className={`mt-10 rounded-2xl border p-6 text-center sm:p-8 ${colors.section}`}>
          <div className="mb-3 text-3xl">☕</div>

          <h2 className={`text-xl font-bold ${colors.heading}`}>
            Your next favourite story is waiting.
          </h2>

          <p className={`mx-auto mt-2 max-w-lg text-sm leading-6 ${colors.muted}`}>
            Take a little break, find a comfortable place, and get lost
            in a beautiful story.
          </p>

          <Link
            to="/explore"
            className={`mt-5 inline-flex rounded-xl px-6 py-3 text-sm font-semibold transition ${
              isDark
                ? 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'
                : 'bg-[#A66B50] text-white hover:bg-[#89543F]'
            }`}
          >
            Discover More Stories →
          </Link>
        </section>

        <p className={`mt-8 text-center text-xs leading-5 ${colors.muted}`}>
          Your bookmarks and reading history are stored in this browser.
          Clearing browser storage may remove them.
        </p>
      </div>
    </main>
  )
}
