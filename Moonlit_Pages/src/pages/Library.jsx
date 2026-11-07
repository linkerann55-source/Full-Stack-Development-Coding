import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { getStories } from '../api/stories.js'

const BOOKMARKS_KEY = 'moonlit_pages_bookmarks'
const OFFLINE_KEY = 'moonlit_pages_offline_stories'

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

function normalizeBookmark(item, allStories) {
  if (typeof item === 'object' && item !== null) {
    return item
  }

  return allStories.find(
    (story) => String(story.id) === String(item)
  )
}

function StoryCard({ story, onRemove, label, isDark }) {
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
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        colors.panel
      } ${
        isDark
          ? 'hover:border-[#8B6CCF]/60 hover:shadow-[#8B6CCF]/10'
          : 'hover:border-[#C79A7B] hover:shadow-[#A66B50]/10'
      }`}
    >
      {/* Story cover */}
      <div
        className={`relative flex min-h-40 items-center justify-center overflow-hidden ${colors.cover}`}
      >
        <span className="absolute left-8 top-5 text-sm opacity-50">
          ✦
        </span>

        <span className="absolute right-8 top-8 text-lg opacity-50">
          ✧
        </span>

        <span className="absolute bottom-5 left-12 text-lg opacity-50">
          ✧
        </span>

        <span className="absolute bottom-5 right-10 text-sm opacity-50">
          ✦
        </span>

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

      {/* Story information */}
      <div className="flex flex-1 flex-col p-5">
        <div>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${colors.genre}`}
          >
            {story.genre || 'General'}
          </span>
        </div>

        <h3
          className={`mt-4 line-clamp-2 text-lg font-bold ${colors.heading}`}
        >
          {story.title || 'Untitled Story'}
        </h3>

        <p className={`mt-1 text-sm ${colors.accent}`}>
          By {story.author || story.authorName || 'Anonymous'}
        </p>

        {story.description && (
          <p
            className={`mt-3 line-clamp-3 flex-1 text-sm leading-6 ${colors.muted}`}
          >
            {story.description}
          </p>
        )}

        {!story.description && <div className="flex-1" />}

        <div className={`mt-5 flex gap-2 border-t pt-4 ${colors.border}`}>
          <Link
            to={`/reader/${story.id}`}
            state={{ story }}
            className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition ${colors.button}`}
          >
            Read Story →
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
  
  const outletContext = useOutletContext()
  const theme = outletContext?.theme || 'dark'
  const isDark = theme === 'dark'

  console.log('Current Library Theme:', theme)

  const [bookmarks, setBookmarks] = useState([])
  const [offlineStories, setOfflineStories] = useState([])
  const [publishedStories, setPublishedStories] = useState([])
  const [activeTab, setActiveTab] = useState('saved')

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


  const loadLibrary = useCallback(async () => {
  setBookmarks(readList(BOOKMARKS_KEY))
  setOfflineStories(readList(OFFLINE_KEY))

  try {
    const result = await getStories()

    const stories = Array.isArray(result) ? result : []

    setPublishedStories(
      stories.map((story) => ({
        ...story,
        id: story.id,
        title: story.title || 'Untitled Story',
        author: story.author || story.user?.name || 'Anonymous',
        genre: story.genre || 'Other',
        coverImage: story.cover_image || '',
        emoji: '📖',
      }))
    )
  } catch (error) {
    console.error('Unable to load library stories:', error)
    setPublishedStories([])
  }
}, [])

useEffect(() => {
  loadLibrary()

  window.addEventListener('storage', loadLibrary)
  window.addEventListener('moonlit-stories-updated', loadLibrary)

  return () => {
    window.removeEventListener('storage', loadLibrary)
    window.removeEventListener('moonlit-stories-updated', loadLibrary)
  }
}, [loadLibrary])

const allStories = publishedStories

  const savedStories = useMemo(() => {
    return bookmarks
      .map((item) => normalizeBookmark(item, allStories))
      .filter(Boolean)
      .filter(
        (story, index, array) =>
          array.findIndex((item) => item.id === story.id) === index,
      )
  }, [bookmarks, allStories])

  const uniqueOfflineStories = useMemo(() => {
    return offlineStories
      .filter((story) => story && story.id)
      .filter(
        (story, index, array) =>
          array.findIndex((item) => item.id === story.id) === index,
      )
  }, [offlineStories])

  function removeBookmark(id) {
    const updated = bookmarks.filter((item) =>
      typeof item === 'object' && item !== null
        ? item.id !== id
        : item !== id,
    )

    if (saveList(BOOKMARKS_KEY, updated)) {
      setBookmarks(updated)
    }
  }

  function removeOfflineStory(id) {
    const updated = offlineStories.filter((story) => story?.id !== id)

    if (saveList(OFFLINE_KEY, updated)) {
      setOfflineStories(updated)
    }
  }

  const displayedStories =
    activeTab === 'saved' ? savedStories : uniqueOfflineStories

  return (
    <main
      className={`min-h-screen px-4 py-8 transition-colors duration-300 sm:px-6 lg:px-10 ${colors.page}`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Page heading */}
        <header className="mb-8">
          <p
            className={`text-sm font-semibold uppercase tracking-[0.25em] ${colors.accent}`}
          >
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

        {/* Library summary */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={`rounded-2xl border p-5 sm:p-6 ${colors.panel}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${colors.muted}`}>
                  Saved Stories
                </p>

                <p className={`mt-2 text-3xl font-bold ${colors.heading}`}>
                  {savedStories.length}
                </p>
              </div>

              <div className="text-3xl">♡</div>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 sm:p-6 ${colors.panel}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${colors.muted}`}>
                  Offline Collection
                </p>

                <p className={`mt-2 text-3xl font-bold ${colors.heading}`}>
                  {uniqueOfflineStories.length}
                </p>
              </div>

              <div className="text-3xl">📚</div>
            </div>
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
              ♡ Saved Stories ({savedStories.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('offline')}
              className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${
                activeTab === 'offline'
                  ? colors.activeTab
                  : colors.inactiveTab
              }`}
            >
              ↓ Offline Stories ({uniqueOfflineStories.length})
            </button>
          </div>
        </section>

        {/* Section heading */}
        <section className="mb-5">
          <h2 className={`text-2xl font-bold ${colors.heading}`}>
            {activeTab === 'saved'
              ? 'Your Saved Stories'
              : 'Your Offline Collection'}
          </h2>

          <p className={`mt-2 text-sm ${colors.muted}`}>
            {activeTab === 'saved'
              ? 'All the stories you have bookmarked in one place.'
              : 'Stories you have saved for offline access.'}
          </p>
        </section>

        {/* Story cards or empty state */}
        {displayedStories.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                label={
                  activeTab === 'saved'
                    ? 'saved stories'
                    : 'offline stories'
                }
                onRemove={
                  activeTab === 'saved'
                    ? removeBookmark
                    : removeOfflineStory
                }
                isDark={isDark}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            emoji={activeTab === 'saved' ? '🌙' : '📚'}
            title={
              activeTab === 'saved'
                ? 'Your library is waiting'
                : 'No offline stories yet'
            }
            description={
              activeTab === 'saved'
                ? 'Discover stories you love and bookmark them to keep them in your personal library.'
                : 'Save a story for offline access, and it will appear in this collection.'
            }
            link="/explore"
            linkText="Explore Stories"
            isDark={isDark}
          />
        )}

        {/* Bottom banner */}
        <section
          className={`mt-10 rounded-2xl border p-6 text-center sm:p-8 ${colors.section}`}
        >
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
          Your library is stored in this browser. Clearing browser storage
          may remove your saved stories.
        </p>
      </div>
    </main>
  )
}