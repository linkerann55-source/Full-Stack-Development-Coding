
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams, useOutletContext } from 'react-router-dom'
import { getStories } from '../api/stories.js'

const genres = [
  'All Stories',
  'Fantasy',
  'Romance',
  'Mystery',
  'Thriller',
  'Horror',
  'Adventure',
  'Science Fiction',
  'Drama',
  'Other',
]

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Recently Added' },
  { value: 'title', label: 'Title: A–Z' },
  { value: 'chapters', label: 'Most Chapters' },
]

function normalizeStory(story, index) {
  const author =
    typeof story.author === 'object'
      ? story.author?.name
      : story.author

  // Read the actual chapter count returned by Laravel
  const chapterCount = Number(
    story.chapters_count ??
    story.chapter_count ??
    story.chapterCount ??
    (Array.isArray(story.chapters)
      ? story.chapters.length
      : story.chapters)
  ) || 0

  return {
    ...story,
    id: story.id ?? story._id ?? story.slug ?? `story-${index}`,
    title: story.title || 'Untitled Story',
    author:
      author ||
      story.authorName ||
      story.user?.name ||
      story.username ||
      'Unknown Author',
    genre: story.genre || 'Other',
    description:
      story.description ||
      story.summary ||
      'A new story waiting to be discovered.',
    coverImage: story.cover_image || story.coverImage || '',
    emoji: story.emoji || '📖',
    rating: Number(story.rating ?? story.average_rating) || 0,
    chapters: chapterCount,
    readers: Number(
      story.readers ??
      story.readCount ??
      story.views ??
      story.read_count
    ) || 0,
    createdAt: story.created_at || story.createdAt || '',
  }
}

function extractStories(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.stories)) return result.stories
  if (Array.isArray(result?.data?.stories)) return result.data.stories
  if (Array.isArray(result?.data)) return result.data

  return []
}

export default function Explore() {
  const outletContext = useOutletContext() || {}
  const isDark = outletContext.theme === 'dark'

  const [searchParams, setSearchParams] = useSearchParams()

  const [publishedStories, setPublishedStories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [searchInput, setSearchInput] = useState(
    searchParams.get('search') || ''
  )

  const initialGenre = searchParams.get('genre') || 'All Stories'

  const [selectedGenre, setSelectedGenre] = useState(
    genres.includes(initialGenre) ? initialGenre : 'All Stories'
  )

  const initialSort = searchParams.get('sort') || 'popular'

  const [sortBy, setSortBy] = useState(
    sortOptions.some((option) => option.value === initialSort)
      ? initialSort
      : 'popular'
  )

  const colors = {
    page: isDark
      ? 'bg-[#10091F] text-[#F5EFFB]'
      : 'bg-[#F5EBDD] text-[#49372E]',

    heading: isDark
      ? 'text-[#F5EFFB]'
      : 'text-[#49372E]',

    muted: isDark
      ? 'text-[#B9ADC9]'
      : 'text-[#88796F]',

    accent: isDark
      ? 'text-[#D6B779]'
      : 'text-[#A66B50]',

    border: isDark
      ? 'border-[#3A2D50]'
      : 'border-[#E7D9C9]',

    panel: isDark
      ? 'border-[#3A2D50] bg-[#25183D]'
      : 'border-[#E7D9C9] bg-[#FFF9F1]',

    input: isDark
      ? 'border-[#3A2D50] bg-[#1A122B] text-[#F5EFFB] placeholder:text-[#887B9B] focus:border-[#8B6CCF]'
      : 'border-[#E7D9C9] bg-[#FFF9F1] text-[#49372E] placeholder:text-[#A99A8F] focus:border-[#A66B50]',

    primaryButton: isDark
      ? 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'
      : 'bg-[#A66B50] text-white hover:bg-[#89543F]',

    section: isDark
      ? 'border-[#3A2D50] bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
      : 'border-[#E7D9C9] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',

    activeGenre: isDark
      ? 'border-[#8B6CCF] bg-[#8B6CCF] text-white'
      : 'border-[#A66B50] bg-[#A66B50] text-white',

    inactiveGenre: isDark
      ? 'border-[#3A2D50] bg-[#25183D] text-[#B9ADC9] hover:border-[#8B6CCF] hover:text-[#F5EFFB]'
      : 'border-[#E7D9C9] bg-[#FFF9F1] text-[#88796F] hover:border-[#A66B50] hover:text-[#49372E]',
  }

  // Load published stories from Laravel
  useEffect(() => {
    const controller = new AbortController()

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true)
        setLoadError('')

        const result = await getStories(
          {
            search: searchInput.trim(),
            genre: selectedGenre === 'All Stories'
              ? ''
              : selectedGenre,
          },
          {
            signal: controller.signal,
          }
        )

        if (!controller.signal.aborted) {
          setPublishedStories(extractStories(result))
        }
      } catch (error) {
        if (
          !controller.signal.aborted &&
          error.code !== 'ERR_CANCELED' &&
          error.name !== 'CanceledError'
        ) {
          console.error('Unable to load published stories:', error)
          setLoadError('Unable to load stories. Please try again.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 350)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [searchInput, selectedGenre, refreshKey])

  // Update URL search parameters
  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)

    if (searchInput.trim()) {
      nextParams.set('search', searchInput.trim())
    } else {
      nextParams.delete('search')
    }

    if (selectedGenre !== 'All Stories') {
      nextParams.set('genre', selectedGenre)
    } else {
      nextParams.delete('genre')
    }

    if (sortBy !== 'popular') {
      nextParams.set('sort', sortBy)
    } else {
      nextParams.delete('sort')
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [
    searchInput,
    selectedGenre,
    sortBy,
    searchParams,
    setSearchParams,
  ])

  // Normalize stories
  const allStories = useMemo(() => {
    return publishedStories.map((story, index) =>
      normalizeStory(story, index)
    )
  }, [publishedStories])

  // Search, filter and sort stories
  const filteredStories = useMemo(() => {
    const search = searchInput.trim().toLowerCase()

    let result = allStories.filter((story) => {
      const matchesSearch =
        !search ||
        story.title.toLowerCase().includes(search) ||
        story.author.toLowerCase().includes(search) ||
        story.genre.toLowerCase().includes(search) ||
        story.description.toLowerCase().includes(search)

      const matchesGenre =
        selectedGenre === 'All Stories' ||
        story.genre.toLowerCase() === selectedGenre.toLowerCase()

      return matchesSearch && matchesGenre
    })

    result = [...result]

    switch (sortBy) {
      case 'title':
        result.sort((a, b) =>
          a.title.localeCompare(b.title)
        )
        break

      case 'chapters':
        result.sort((a, b) =>
          b.chapters - a.chapters
        )
        break

      case 'newest':
        result.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime()
          const dateB = new Date(b.createdAt || 0).getTime()

          return dateB - dateA
        })
        break

      case 'popular':
      default:
        result.sort(
          (a, b) =>
            b.readers - a.readers ||
            b.rating - a.rating
        )
        break
    }

    return result
  }, [allStories, searchInput, selectedGenre, sortBy])

  function clearFilters() {
    setSearchInput('')
    setSelectedGenre('All Stories')
    setSortBy('popular')
  }

  function retryLoading() {
    setRefreshKey((previous) => previous + 1)
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${colors.page}`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Page heading */}
        <section className={`relative mb-8 overflow-hidden rounded-3xl border p-6 sm:p-10 ${colors.section}`}>
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#A66B50]/10 blur-3xl" />

          <div className="relative">
            <p className={`mb-3 text-sm font-semibold uppercase tracking-[0.25em] ${colors.accent}`}>
              FIND YOUR NEXT FAVOURITE
            </p>

            <h1 className={`mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl ${colors.heading}`}>
              Explore Stories
            </h1>

            <p className={`max-w-2xl text-sm leading-7 sm:text-base ${colors.muted}`}>
              Discover magical worlds, unforgettable characters, and
              stories that stay with you long after the last page.
              Your next favourite story is waiting here. ✨
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className={`rounded-full border px-4 py-2 text-sm ${colors.border} ${isDark ? 'bg-[#1A122B]' : 'bg-[#FFF9F1]'}`}>
                📚 <span className={colors.heading}>{allStories.length}</span>{' '}
                <span className={colors.muted}>Stories</span>
              </div>

              <div className={`rounded-full border px-4 py-2 text-sm ${colors.border} ${isDark ? 'bg-[#1A122B]' : 'bg-[#FFF9F1]'}`}>
                🌷 <span className={colors.heading}>{genres.length - 1}</span>{' '}
                <span className={colors.muted}>Genres</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search and sorting */}
        <section className={`mb-8 rounded-2xl border p-5 sm:p-6 ${colors.panel}`}>
          <label htmlFor="explore-search" className={`mb-3 block text-sm font-semibold ${colors.heading}`}>
            Find a story
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2">
                🔍
              </span>

              <input
                id="explore-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by title, author, genre, description..."
                className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none transition ${colors.input}`}
              />
            </div>

            <select
              aria-label="Sort stories"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className={`rounded-xl border px-4 py-3 outline-none transition ${colors.input}`}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Genre filters */}
          <div className="mt-6">
            <h2 className={`mb-3 text-sm font-semibold ${colors.heading}`}>
              Browse by genre
            </h2>

            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => {
                const isActive = selectedGenre === genre

                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(genre)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ${
                      isActive ? colors.activeGenre : colors.inactiveGenre
                    }`}
                  >
                    {genre}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Story list heading */}
        <section className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className={`mb-1 text-sm font-medium ${colors.accent}`}>
              YOUR NEXT CHAPTER STARTS HERE
            </p>

            <h2 className={`text-2xl font-bold sm:text-3xl ${colors.heading}`}>
              {selectedGenre === 'All Stories'
                ? 'Discover Stories'
                : selectedGenre}
            </h2>

            <p className={`mt-2 text-sm ${colors.muted}`}>
              {filteredStories.length}{' '}
              {filteredStories.length === 1 ? 'story' : 'stories'} found
            </p>
          </div>

          {(searchInput || selectedGenre !== 'All Stories' || sortBy !== 'popular') && (
            <button
              type="button"
              onClick={clearFilters}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${colors.accent}`}
            >
              Clear filters ↺
            </button>
          )}
        </section>

        {/* Story cards */}
        {isLoading ? (
          <div className={`rounded-2xl border p-12 text-center ${colors.panel}`}>
            <p className={colors.muted}>Searching stories...</p>
          </div>
        ) : loadError ? (
          <div className={`rounded-2xl border p-12 text-center ${colors.panel}`}>
            <p className="text-red-500">{loadError}</p>

            <button
              type="button"
              onClick={retryLoading}
              className={`mt-4 rounded-xl px-5 py-2 ${colors.primaryButton}`}
            >
              Try again
            </button>
          </div>
        ) : filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStories.map((story) => (
              <article
                key={story.id}
                className={`group flex h-full flex-col overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 hover:shadow-xl ${colors.panel} ${
                  isDark
                    ? 'hover:border-[#8B6CCF]/70 hover:shadow-[#8B6CCF]/10'
                    : 'hover:border-[#C79A7B] hover:shadow-[#A66B50]/10'
                }`}
              >
                {/* Story cover */}
                <div className={`relative flex h-40 items-center justify-center overflow-hidden ${
                  isDark
                    ? 'bg-gradient-to-br from-[#33234C] via-[#25183D] to-[#10091F]'
                    : 'bg-gradient-to-br from-[#F5EBDD] via-[#EAD9C7] to-[#D9BDA6]'
                }`}>
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute left-8 top-7 text-lg">✦</div>
                    <div className="absolute right-10 top-10 text-sm">✧</div>
                    <div className="absolute bottom-7 left-16 text-sm">✧</div>
                    <div className="absolute bottom-8 right-14 text-lg">✦</div>
                  </div>

                  {story.coverImage ? (
                    <img
                      src={story.coverImage}
                      alt={`${story.title} cover`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="relative text-6xl">
                      {story.emoji}
                    </span>
                  )}

                  <span className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-xs font-semibold ${
                    isDark
                      ? 'border-[#8B6CCF]/40 bg-[#1A122B]/90 text-[#D6B779]'
                      : 'border-[#E7D9C9] bg-[#FFF9F1]/90 text-[#A66B50]'
                  }`}>
                    {story.genre}
                  </span>

                  {story.rating > 0 && (
                    <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${
                      isDark
                        ? 'bg-[#1A122B]/90 text-[#D6B779]'
                        : 'bg-[#FFF9F1]/90 text-[#A66B50]'
                    }`}>
                      ★ {story.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Story details */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className={`mb-2 line-clamp-2 text-xl font-bold transition ${
                    isDark
                      ? 'text-[#F5EFFB] group-hover:text-[#D6B779]'
                      : 'text-[#49372E] group-hover:text-[#A66B50]'
                  }`}>
                    {story.title}
                  </h3>

                  <p className={`mb-3 text-sm ${colors.muted}`}>
                    By {story.author}
                  </p>

                  <p className={`mb-5 line-clamp-3 flex-1 text-sm leading-6 ${colors.muted}`}>
                    {story.description}
                  </p>

                  <div className={`mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-xs ${colors.border} ${colors.muted}`}>
                    <span>📖 {story.chapters} chapters</span>

                    {story.readers > 0 && (
                      <span>
                        👁 {story.readers.toLocaleString()} reads
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/story/${story.id}`}
                    state={{ story }}
                    className={`block rounded-xl px-4 py-3 text-center text-sm font-semibold transition duration-200 ${colors.primaryButton}`}
                  >
                    View Story →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={`rounded-2xl border px-6 py-16 text-center ${colors.panel}`}>
            <div className="mb-4 text-5xl">📚</div>

            <h3 className={`mb-2 text-xl font-bold ${colors.heading}`}>
              No stories found
            </h3>

            <p className={`mx-auto mb-6 max-w-md text-sm leading-6 ${colors.muted}`}>
              We couldn't find any stories matching your search.
              Try another title or explore a different genre.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className={`rounded-xl px-6 py-3 text-sm font-semibold transition ${colors.primaryButton}`}
            >
              Explore All Stories
            </button>
          </div>
        )}

        {/* Writer CTA */}
        <section className={`mt-12 overflow-hidden rounded-3xl border p-7 text-center sm:p-10 ${colors.section}`}>
          <div className="mb-3 text-4xl">✍️</div>

          <h2 className={`mb-3 text-2xl font-bold sm:text-3xl ${colors.heading}`}>
            Have a story to share?
          </h2>

          <p className={`mx-auto mb-6 max-w-xl text-sm leading-7 ${colors.muted}`}>
            Every great story begins with an idea. Create your own
            magical world and share it with the Moonlit Pages community.
          </p>

          <Link
            to="/writer"
            className={`inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition ${colors.primaryButton}`}
          >
            Start Writing ✨
          </Link>
        </section>

      </div>
    </main>
  )
}
