import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../utils/auth.js'
import { getStories } from '../api/stories.js'
import { searchUsers } from '../api/profile.js'
import {
  likeStory,
  unlikeStory,
  checkStoryLike,
} from '../utils/social.js'

const API_ORIGIN = 'http://127.0.0.1:8000'

const genres = [
  { name: 'All Stories', emoji: '✦' },
  { name: 'Fantasy', emoji: '🔮' },
  { name: 'Romance', emoji: '♡' },
  { name: 'Mystery', emoji: '⌕' },
  { name: 'Thriller', emoji: '☾' },
]

// Convert Laravel avatar paths into working image URLs
function getAvatarUrl(avatar) {
  if (!avatar || typeof avatar !== 'string') return null

  if (avatar.startsWith('data:image/')) {
    return avatar
  }

  if (/^https?:\/\//i.test(avatar)) {
    try {
      const url = new URL(avatar)

      if (
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1'
      ) {
        avatar = url.pathname
      } else {
        return avatar
      }
    } catch {
      return null
    }
  }

  avatar = avatar.replace(/^\/+/, '')

  if (avatar.startsWith('storage/')) {
    return `${API_ORIGIN}/${avatar}`
  }

  return `${API_ORIGIN}/storage/${avatar}`
}

function StoryCard({ story, isDark, currentUser }) {
  const readerLink = `/reader?story=${encodeURIComponent(story.id)}`

  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(story.likes_count ?? 0)
  const [liking, setLiking] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      setLiked(false)
      return
    }

    let active = true

    checkStoryLike(story.id)
      .then((data) => {
        if (active) setLiked(data.liked)
      })
      .catch((error) => {
        console.error('Failed to check story like:', error)
      })

    return () => {
      active = false
    }
  }, [story.id, currentUser])

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please log in to like this story.')
      return
    }

    if (liking) return

    setLiking(true)

    const previousLiked = liked
    const previousCount = likesCount

    setLiked(!previousLiked)
    setLikesCount(previousCount + (previousLiked ? -1 : 1))

    try {
      const response = previousLiked
        ? await unlikeStory(story.id)
        : await likeStory(story.id)

      if (response.success) {
        setLikesCount(response.likes_count)
      }
    } catch (error) {
      setLiked(previousLiked)
      setLikesCount(previousCount)
      console.error('Failed to update like:', error)
      alert('Unable to update like. Please try again.')
    } finally {
      setLiking(false)
    }
  }

  const cardStyle = isDark
    ? 'border-[#3A2D50] bg-[#25183D] hover:border-[#8B6CCF] shadow-black/20'
    : 'border-[#E7D9C9] bg-[#FFF9F1] hover:border-[#A66B50] shadow-[#49372E]/5'

  const headingStyle = isDark
    ? 'text-[#F5EFFB] group-hover:text-[#D6B779]'
    : 'text-[#49372E] group-hover:text-[#A66B50]'

  const bodyStyle = isDark
    ? 'text-[#B9ADC9]'
    : 'text-[#88796F]'

  const accentStyle = isDark
    ? 'text-[#D6B779]'
    : 'text-[#A66B50]'

  return (
    <article
      className={`group overflow-hidden rounded-2xl border shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl ${cardStyle}`}
    >
      <Link to={readerLink} aria-label={`Read ${story.title}`}>
        <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-700">
          {story.cover_image ? (
            <img
              src={story.cover_image}
              alt={story.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="text-7xl">🌙</span>
          )}

          <span className="absolute bottom-3 right-3 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
            {story.chapters} chapters
          </span>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold ${accentStyle}`}>
            {story.genre}
          </span>

          <button
            type="button"
            onClick={handleLike}
            disabled={liking}
            aria-label={liked ? 'Unlike story' : 'Like story'}
            className={`flex items-center gap-1.5 text-sm transition hover:scale-105 disabled:opacity-50 ${
              liked ? 'text-pink-500' : 'text-gray-500'
            }`}
          >
            <span>{liked ? '♥' : '♡'}</span>
            <span>{likesCount} likes</span>
          </button>
        </div>

        <Link to={readerLink}>
          <h3 className={`mt-3 text-lg font-semibold transition ${headingStyle}`}>
            {story.title}
          </h3>
        </Link>

        <p className={`mt-1 text-sm ${bodyStyle}`}>
          by {story.author}
        </p>

        <p className={`mt-3 line-clamp-2 text-sm leading-6 ${bodyStyle}`}>
          {story.description}
        </p>

        <Link
          to={readerLink}
          className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold transition ${accentStyle}`}
        >
          Read story <span>→</span>
        </Link>
      </div>
    </article>
  )
}

function UserSearchResults({
  users,
  loading,
  error,
  isDark,
  colors,
}) {
  return (
    <div className={`mt-4 overflow-hidden rounded-2xl border ${colors.panel}`}>
      <div className={`border-b px-5 py-3 ${colors.border}`}>
        <h3 className={`font-semibold ${colors.heading}`}>
          People
        </h3>

        <p className={`mt-1 text-xs ${colors.muted}`}>
          Search results for usernames
        </p>
      </div>

      <div className="p-4">
        {loading ? (
          <p className={`py-3 text-center text-sm ${colors.body}`}>
            Searching users...
          </p>
        ) : error ? (
          <p className="py-3 text-center text-sm text-red-400">
            {error}
          </p>
        ) : users.length > 0 ? (
          <div className="space-y-3">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/user/${encodeURIComponent(user.username)}`}
                className={`flex items-center gap-3 rounded-xl p-3 transition ${
                  isDark
                    ? 'hover:bg-[#35254D]'
                    : 'hover:bg-[#F0E3D4]'
                }`}
              >
                {getAvatarUrl(user.avatar) ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user.username}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none'
                    }}
                    className="h-12 w-12 shrink-0 rounded-full border border-purple-400/30 object-cover"
                  />
                ) : (
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl ${
                      isDark ? 'bg-[#3A2D50]' : 'bg-[#EAD9C7]'
                    }`}
                  >
                    🌙
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className={`truncate font-semibold ${colors.heading}`}>
                    {user.name || user.username}
                  </p>

                  <p className={`truncate text-sm ${colors.muted}`}>
                    @{user.username}
                  </p>

                  {user.bio && (
                    <p className={`mt-1 line-clamp-1 text-xs ${colors.body}`}>
                      {user.bio}
                    </p>
                  )}
                </div>

                <span className={colors.accent}>→</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className={`py-3 text-center text-sm ${colors.body}`}>
            No matching users found.
          </p>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const { theme } = useOutletContext()
  const isDark = theme === 'dark'

  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All Stories')
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser())

  const [stories, setStories] = useState([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [storiesError, setStoriesError] = useState('')

  const [searchedUsers, setSearchedUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearchError, setUserSearchError] = useState('')

  const navigate = useNavigate()

  const featuredStory = [...stories].sort(
    (a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0)
  )[0]

  const colors = {
    heading: isDark ? 'text-[#F5EFFB]' : 'text-[#49372E]',
    body: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    muted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    accent: isDark ? 'text-[#D6B779]' : 'text-[#A66B50]',
    border: isDark ? 'border-[#3A2D50]' : 'border-[#E7D9C9]',

    panel: isDark
      ? 'border-[#3A2D50] bg-[#25183D]'
      : 'border-[#E7D9C9] bg-[#FFF9F1]',

    primaryButton: isDark
      ? 'bg-[#8B6CCF] hover:bg-[#7453B5]'
      : 'bg-[#A66B50] hover:bg-[#89543F]',

    secondaryButton: isDark
      ? 'border-[#594477] text-[#D6B779] hover:bg-[#25183D]'
      : 'border-[#D8BFA3] text-[#A66B50] hover:bg-[#F0E3D4]',

    sectionBackground: isDark
      ? 'border-[#3A2D50] bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
      : 'border-[#E7D9C9] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',
  }

  // Load published stories
  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoadingStories(true)
        setStoriesError('')

        const response = await getStories()

        const storyList = Array.isArray(response)
          ? response
          : response.stories || response.data || []

        setStories(
          storyList.map((story) => ({
            ...story,
            author: story.author || story.user?.name || 'Unknown Author',
            genre: story.genre || 'Other',
            description: story.description || '',
            chapters: story.chapters_count ?? 0,
            cover_image: story.cover_image || '',
            likes_count: story.likes_count ?? 0,
            emoji: '🌙',
          }))
        )
      } catch (error) {
        console.error('Failed to load Home stories:', error)
        setStoriesError('Unable to load stories. Please try again.')
      } finally {
        setLoadingStories(false)
      }
    }

    loadStories()
  }, [])

  // Update logged-in user
  useEffect(() => {
    const updateUser = () => setCurrentUser(getCurrentUser())

    window.addEventListener('storage', updateUser)
    window.addEventListener('moonlit-auth-updated', updateUser)

    return () => {
      window.removeEventListener('storage', updateUser)
      window.removeEventListener('moonlit-auth-updated', updateUser)
    }
  }, [])

  // Search users by username
  useEffect(() => {
    const searchText = search.trim()

    if (!searchText) {
      setSearchedUsers([])
      setUserSearchError('')
      setLoadingUsers(false)
      return
    }

    let active = true

    const timer = setTimeout(async () => {
      try {
        setLoadingUsers(true)
        setUserSearchError('')

        const response = await searchUsers(searchText)

        if (!active) return

        const userList = Array.isArray(response)
          ? response
          : response.users || response.data || []

        setSearchedUsers(userList)
      } catch (error) {
        if (active) {
          console.error('Failed to search users:', error)
          setSearchedUsers([])
          setUserSearchError('Unable to search users. Please try again.')
        }
      } finally {
        if (active) {
          setLoadingUsers(false)
        }
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search])

  async function handleLogout() {
    await logoutUser()

    setCurrentUser(null)

    window.dispatchEvent(new Event('moonlit-auth-updated'))

    navigate('/')
  }

  // Filter stories
  const filteredStories = stories.filter((story) => {
    const searchText = search.toLowerCase().trim()

    const matchesGenre =
      selectedGenre === 'All Stories' ||
      story.genre?.toLowerCase() === selectedGenre.toLowerCase()

    const matchesSearch =
      !searchText ||
      story.title?.toLowerCase().includes(searchText) ||
      story.author?.toLowerCase().includes(searchText) ||
      story.genre?.toLowerCase().includes(searchText)

    return matchesGenre && matchesSearch
  })

  return (
    <div
      className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-[#10091F] text-[#F5EFFB]'
          : 'bg-[#F5EBDD] text-[#49372E]'
      }`}
    >
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-purple-700/15 blur-3xl" />
            <div className="absolute -right-40 top-96 h-96 w-96 rounded-full bg-indigo-700/15 blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#D8BFA3]/20 blur-3xl" />
            <div className="absolute -right-40 top-96 h-96 w-96 rounded-full bg-[#A66B50]/10 blur-3xl" />
          </>
        )}
      </div>

      <div className="relative mx-auto max-w-7xl space-y-10 pb-10 sm:space-y-14">

        {/* Header */}
        <header
          className={`flex flex-wrap items-center justify-between gap-4 border-b py-5 ${colors.border}`}
        >
          <Link to="/" className="group flex items-center gap-3">
            <div
              className={`h-12 w-12 overflow-hidden rounded-xl shadow-sm ${
                isDark ? 'bg-[#25183D]' : 'bg-[#F5EBDD]'
              }`}
            >
              <img
                src={isDark ? '/images/logo2.png' : '/images/moonlit-page.png'}
                alt="Moonlit Pages Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className={`font-serif text-xl font-bold tracking-wide sm:text-2xl ${colors.heading}`}>
                Moonlit Pages
              </h1>

              <p className={`text-[10px] tracking-[0.18em] sm:text-xs ${colors.muted}`}>
                READ · WRITE · DREAM
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                <Link
                  to="/profile"
                  className={`max-w-28 truncate rounded-lg px-3 py-2 text-sm transition hover:underline sm:max-w-40 ${colors.accent}`}
                >
                  {currentUser.username || currentUser.name || 'My Profile'}
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`rounded-xl border px-3 py-2 text-sm transition sm:px-4 ${colors.secondaryButton}`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`rounded-xl border px-3 py-2 text-sm transition sm:px-4 ${colors.secondaryButton}`}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className={`rounded-xl px-3 py-2 text-sm font-semibold text-white shadow transition hover:-translate-y-0.5 sm:px-4 ${colors.primaryButton}`}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Welcome section */}
        <section className="grid items-center gap-8 py-4 md:grid-cols-[1.2fr_0.8fr] md:py-8">
          <div>
            <p className={`text-xs font-semibold tracking-[0.3em] sm:text-sm ${colors.accent}`}>
              ✦ YOUR STORYBOOK UNIVERSE ✦
            </p>

            <h2 className={`mt-5 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl ${colors.heading}`}>
              Every page holds

              <span
                className={`block bg-gradient-to-r bg-clip-text text-transparent ${
                  isDark
                    ? 'from-[#D6B779] via-[#E9D5FF] to-[#8B6CCF]'
                    : 'from-[#A66B50] via-[#C28E6D] to-[#78866B]'
                }`}
              >
                a little magic
              </span>
            </h2>

            <p className={`mt-5 max-w-xl text-sm leading-7 sm:text-base ${colors.body}`}>
              Step into a world of imagination. Discover enchanting stories,
              share your own words, and become part of a story that never ends.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/explore"
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${colors.primaryButton}`}
              >
                Explore Stories <span>→</span>
              </Link>

              <Link
                to="/writer"
                className={`inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold transition ${colors.secondaryButton}`}
              >
                ✎ Write a Story
              </Link>
            </div>

            <div className={`mt-8 flex flex-wrap gap-5 text-xs sm:gap-7 sm:text-sm ${colors.body}`}>
              <span><span className={colors.accent}>✦</span> Fantasy worlds</span>
              <span><span className={colors.accent}>✦</span> Beautiful stories</span>
              <span><span className={colors.accent}>✦</span> Your imagination</span>
            </div>
          </div>

          {/* Moon logo illustration */}
          <div className="relative flex min-h-64 items-center justify-center sm:min-h-80">
            <div
              className={`absolute h-64 w-64 rounded-full blur-3xl sm:h-80 sm:w-80 ${
                isDark ? 'bg-purple-600/20' : 'bg-[#D8BFA3]/40'
              }`}
            />

            <div
              className={`relative flex h-64 w-64 items-center justify-center rounded-full border shadow-2xl sm:h-80 sm:w-80 ${
                isDark
                  ? 'border-[#594477] bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
                  : 'border-[#D8BFA3] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]'
              }`}
            >
              <div className={`absolute inset-4 rounded-full border ${colors.border}`} />
              <div className={`absolute inset-8 rounded-full border ${colors.border}`} />

              <span className={`absolute left-10 top-12 text-xl ${colors.accent}`}>✦</span>
              <span className={`absolute right-12 top-10 text-2xl ${colors.accent}`}>✧</span>
              <span className={`absolute bottom-16 left-12 text-lg ${colors.accent}`}>✦</span>
              <span className={`absolute bottom-12 right-12 text-xl ${colors.accent}`}>✧</span>

              <div className="relative flex flex-col items-center">
                <div className="h-80 w-80 overflow-hidden rounded-xl">
                  <img
                    src="/images/logo.png"
                    alt="Moonlit Pages crescent moon logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section>
          <form
            onSubmit={(event) => {
              event.preventDefault()

              if (search.trim()) {
                navigate(`/explore?search=${encodeURIComponent(search.trim())}`)
              }
            }}
            className={`flex items-center gap-3 rounded-2xl border p-3 shadow-lg transition focus-within:ring-2 sm:p-4 ${
              isDark
                ? 'border-[#3A2D50] bg-[#25183D] focus-within:ring-[#8B6CCF]/30'
                : 'border-[#E7D9C9] bg-[#FFF9F1] focus-within:ring-[#A66B50]/20'
            }`}
          >
            <span className={`text-2xl ${colors.accent}`}>⌕</span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stories, authors, or usernames..."
              aria-label="Search stories and users"
              className={`min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-60 sm:text-base ${colors.heading}`}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={`px-2 text-sm ${colors.muted}`}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}

            <button
              type="submit"
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition sm:px-6 ${colors.primaryButton}`}
            >
              Search
            </button>
          </form>

          {/* Username search results */}
          {search.trim() && (
            <UserSearchResults
              users={searchedUsers}
              loading={loadingUsers}
              error={userSearchError}
              isDark={isDark}
              colors={colors}
            />
          )}
        </section>

        {/* Featured story */}
        {!loadingStories && featuredStory && (
          <section className="mb-12">
            <div className={`relative overflow-hidden rounded-3xl border p-8 sm:p-10 ${colors.panel}`}>
              <div className="relative z-10 max-w-2xl">
                <p className={`text-xs font-semibold tracking-[0.2em] ${colors.accent}`}>
                  ✦ FEATURED STORY
                </p>

                <h2 className={`mt-4 font-serif text-3xl font-bold sm:text-4xl ${colors.heading}`}>
                  {featuredStory.title}
                </h2>

                <p className={`mt-4 text-sm leading-7 ${colors.body}`}>
                  {featuredStory.description || 'Discover this story on Moonlit Pages.'}
                </p>

                <div className={`mt-5 flex flex-wrap gap-4 text-sm ${colors.muted}`}>
                  <span>✧ {featuredStory.genre}</span>
                  <span>♥ {featuredStory.likes_count ?? 0} likes</span>
                  <span>{featuredStory.chapters} chapters</span>
                </div>

              <Link
                to={`/story/${featuredStory.id}`}
                state={{ story: featuredStory }}
                className={`mt-7 inline-flex rounded-xl px-6 py-3 text-sm font-semibold text-white transition ${colors.primaryButton}`}
              >
                Read Featured Story
              </Link>
              </div>

              {featuredStory.cover_image && (
                <img
                  src={featuredStory.cover_image}
                  alt={featuredStory.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-50"
                />
              )}
            </div>
          </section>
        )}

        {/* Genre filters */}
        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold tracking-[0.2em] ${colors.accent}`}>
                FIND YOUR MOOD
              </p>

              <h2 className={`mt-2 font-serif text-2xl font-bold sm:text-3xl ${colors.heading}`}>
                Explore Genres
              </h2>
            </div>

            <Link
              to="/explore"
              className={`shrink-0 text-sm font-medium transition hover:underline ${colors.accent}`}
            >
              View all →
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            {genres.map((genre) => {
              const isSelected = selectedGenre === genre.name

              return (
                <button
                  type="button"
                  key={genre.name}
                  onClick={() => setSelectedGenre(genre.name)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    isSelected
                      ? isDark
                        ? 'border-[#8B6CCF] bg-[#8B6CCF] text-white shadow-lg'
                        : 'border-[#A66B50] bg-[#A66B50] text-white shadow-lg'
                      : isDark
                        ? 'border-[#3A2D50] bg-[#25183D] text-[#B9ADC9] hover:border-[#8B6CCF] hover:text-[#D6B779]'
                        : 'border-[#E7D9C9] bg-[#FFF9F1] text-[#49372E] hover:border-[#A66B50] hover:text-[#A66B50]'
                  }`}
                >
                  <span className="mr-2">{genre.emoji}</span>
                  {genre.name}
                </button>
              )
            })}
          </div>
        </section>

        {/* Story cards */}
        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className={`text-xs font-semibold tracking-[0.2em] ${colors.accent}`}>
                YOUR NEXT OBSESSION
              </p>

              <h2 className={`mt-2 font-serif text-2xl font-bold sm:text-3xl ${colors.heading}`}>
                {selectedGenre === 'All Stories'
                  ? 'Stories to Fall Into'
                  : `${selectedGenre} Stories`}
              </h2>
            </div>

            <span className={`text-sm ${colors.muted}`}>
              {filteredStories.length} stories found
            </span>
          </div>

          {loadingStories ? (
            <div className={`rounded-2xl border p-10 text-center ${colors.panel}`}>
              <p className={colors.body}>Loading stories...</p>
            </div>
          ) : storiesError ? (
            <div className={`rounded-2xl border p-10 text-center ${colors.panel}`}>
              <p className="text-sm text-red-400">{storiesError}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className={`mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${colors.primaryButton}`}
              >
                Try again
              </button>
            </div>
          ) : filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  isDark={isDark}
                  currentUser={currentUser}
                />
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl border p-10 text-center ${colors.panel}`}>
              <span className="text-4xl">🌙</span>

              <h3 className={`mt-4 font-serif text-xl font-semibold ${colors.heading}`}>
                No stories found
              </h3>

              <p className={`mt-2 text-sm ${colors.body}`}>
                Try another title, author, or genre.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSelectedGenre('All Stories')
                }}
                className={`mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${colors.primaryButton}`}
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        {/* Writer invitation */}
        <section className={`relative overflow-hidden rounded-3xl border p-7 sm:p-10 ${colors.sectionBackground}`}>
          <div className="pointer-events-none absolute -right-10 -top-20 h-60 w-60 rounded-full bg-[#8B6CCF]/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className={`text-xs font-semibold tracking-[0.2em] ${colors.accent}`}>
                FOR THE DREAMERS
              </p>

              <h2 className={`mt-3 font-serif text-2xl font-bold sm:text-3xl ${colors.heading}`}>
                Your story deserves a home.
              </h2>

              <p className={`mt-3 max-w-xl text-sm leading-6 ${colors.body}`}>
                Turn the ideas in your imagination into chapters that readers
                can discover, enjoy, and remember.
              </p>
            </div>

            <Link
              to="/writer"
              className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${colors.primaryButton}`}
            >
              Open Writer Studio <span>✎</span>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className={`border-t py-8 text-center ${colors.border}`}>
          <div className={`mb-2 text-xl ${colors.accent}`}>
            ✦ ☾ ✦
          </div>

          <p className={`font-serif text-lg font-semibold ${colors.heading}`}>
            Moonlit Pages
          </p>

          <p className={`mt-2 text-xs ${colors.muted}`}>
            Read · Write · Be Part of the Story
          </p>

          <p className={`mt-3 text-xs ${colors.muted}`}>
            Made for the stories that live under the moonlight.
          </p>
        </footer>
      </div>
    </div>
  )
}
