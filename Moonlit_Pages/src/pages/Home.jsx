
import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { getCurrentUser, logoutUser } from '../utils/auth.js'

const stories = [
  {
    id: 'moonlit-promise',
    title: 'The Moonlit Promise',
    author: 'Luna Winters',
    genre: 'Fantasy',
    rating: '4.9',
    chapters: 24,
    emoji: '🌙',
    cover: 'from-indigo-950 via-violet-900 to-purple-700',
    description: 'A mysterious promise beneath the moon changes everything for a young dreamer.',
    tag: 'FEATURED',
  },
  {
    id: 'letters-to-you',
    title: 'Letters to You',
    author: 'Mira Rose',
    genre: 'Romance',
    rating: '4.8',
    chapters: 18,
    emoji: '💌',
    cover: 'from-purple-950 via-fuchsia-900 to-pink-700',
    description: 'Unsent letters, unexpected meetings, and a love neither of them planned.',
    tag: 'POPULAR',
  },
  {
    id: 'whispers-dark',
    title: 'Whispers in the Dark',
    author: 'Evelyn Night',
    genre: 'Mystery',
    rating: '4.7',
    chapters: 16,
    emoji: '🕯️',
    cover: 'from-slate-950 via-indigo-950 to-violet-800',
    description: 'Every midnight, a strange whisper reveals another piece of the truth.',
    tag: 'MYSTERY',
  },
  {
    id: 'starlight-academy',
    title: 'Starlight Academy',
    author: 'Aria Moon',
    genre: 'Fantasy',
    rating: '4.9',
    chapters: 32,
    emoji: '✨',
    cover: 'from-blue-950 via-indigo-800 to-violet-500',
    description: 'At a school hidden among the stars, one student discovers an unusual power.',
    tag: 'TRENDING',
  },
  {
    id: 'summer-again',
    title: 'Summer, Again',
    author: 'Sophie Lane',
    genre: 'Romance',
    rating: '4.6',
    chapters: 12,
    emoji: '🌷',
    cover: 'from-rose-950 via-purple-900 to-pink-700',
    description: 'One summer reunion gives two old friends another chance to begin.',
    tag: 'NEW',
  },
  {
    id: 'the-last-door',
    title: 'The Last Door',
    author: 'Noah Grey',
    genre: 'Thriller',
    rating: '4.8',
    chapters: 20,
    emoji: '🚪',
    cover: 'from-gray-950 via-purple-950 to-indigo-700',
    description: 'A locked door, a forgotten key, and a secret no one should uncover.',
    tag: 'THRILLER',
  },
]

const genres = [
  { name: 'All Stories', emoji: '✦' },
  { name: 'Fantasy', emoji: '🔮' },
  { name: 'Romance', emoji: '♡' },
  { name: 'Mystery', emoji: '⌕' },
  { name: 'Thriller', emoji: '☾' },
]

function StoryCard({ story, isDark }) {
  const readerLink = `/reader?story=${encodeURIComponent(story.id)}`

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
        <div
          className={`relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br ${story.cover}`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.18),transparent_60%)]" />

          <span className="absolute right-5 top-4 text-2xl text-white/80">
            ✦
          </span>

          <span className="absolute bottom-5 left-5 text-lg text-white/80">
            ✧
          </span>

          <span className="relative text-7xl drop-shadow-lg transition duration-300 group-hover:scale-110">
            {story.emoji}
          </span>

          <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[10px] font-bold tracking-widest text-white backdrop-blur">
            {story.tag}
          </span>

          <span className="absolute bottom-3 right-3 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white backdrop-blur">
            {story.chapters} chapters
          </span>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs font-semibold ${accentStyle}`}>
            {story.genre}
          </span>

          <span className="text-xs font-medium text-amber-500">
            ★ {story.rating}
          </span>
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

export default function Home() {
  const { theme } = useOutletContext()
  const isDark = theme === 'dark'

  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All Stories')
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser())

  const navigate = useNavigate()

  // Cozy Book Café / Midnight Library
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

  useEffect(() => {
    const updateUser = () => setCurrentUser(getCurrentUser())

    window.addEventListener('storage', updateUser)
    window.addEventListener('moonlit-auth-updated', updateUser)

    return () => {
      window.removeEventListener('storage', updateUser)
      window.removeEventListener('moonlit-auth-updated', updateUser)
    }
  }, [])

  async function handleLogout() {
    await logoutUser()

    setCurrentUser(null)

    window.dispatchEvent(new Event('moonlit-auth-updated'))

    navigate('/')
  }

  const filteredStories = stories.filter((story) => {
    const matchesGenre =
      selectedGenre === 'All Stories' || story.genre === selectedGenre

    const searchText = search.toLowerCase().trim()

    const matchesSearch =
      story.title.toLowerCase().includes(searchText) ||
      story.author.toLowerCase().includes(searchText) ||
      story.genre.toLowerCase().includes(searchText)

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
          <div className={`h-12 w-12 overflow-hidden rounded-xl shadow-sm ${isDark ? 'bg-[#25183D]' : 'bg-[#F5EBDD]'}`}>
              <img
                src={
                  isDark
                  ? '/images/logo2.png'
                  : '/images/moonlit-page.png'
                }
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
                <div className="h-80 w-80 overflow-hidden rounded-1xl">
                  <img
                    src="images/logo.png"
                    alt="Moonlit Pages crescent moon logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            navigate(`/explore?search=${encodeURIComponent(search)}`)
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
            placeholder="Search stories, authors, or genres..."
            aria-label="Search stories"
            className={`min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:opacity-60 sm:text-base ${colors.heading}`}
          />

          <button
            type="submit"
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition sm:px-6 ${colors.primaryButton}`}
          >
            Search
          </button>
        </form>

        {/* Featured story */}
        <section className={`relative overflow-hidden rounded-3xl border p-6 shadow-xl sm:p-10 lg:p-12 ${colors.sectionBackground}`}>
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#8B6CCF]/10 blur-3xl" />

          <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-widest ${
                  isDark
                    ? 'border-[#D6B779]/40 bg-[#D6B779]/10 text-[#D6B779]'
                    : 'border-[#A66B50]/30 bg-[#A66B50]/10 text-[#A66B50]'
                }`}
              >
                ✦ EDITOR'S PICK
              </span>

              <h2 className={`mt-6 max-w-xl font-serif text-3xl font-bold leading-tight sm:text-5xl ${colors.heading}`}>
                The Moonlit Promise
              </h2>

              <p className={`mt-4 max-w-lg text-sm leading-7 sm:text-base ${colors.body}`}>
                Beneath a silver moon, an ordinary girl discovers a promise
                written long before she was born. Some secrets are meant to
                change the stars.
              </p>

              <div className={`mt-5 flex flex-wrap gap-4 text-xs sm:text-sm ${colors.body}`}>
                <span>✧ Fantasy</span>
                <span className="font-medium text-amber-500">★ 4.9 rating</span>
                <span>24 chapters</span>
              </div>

              <Link
                to="/reader?story=moonlit-promise"
                className={`mt-7 inline-flex items-center gap-3 rounded-xl px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 ${colors.primaryButton}`}
              >
                Read Featured Story <span>→</span>
              </Link>
            </div>

            <div className="flex min-h-52 items-center justify-center md:min-h-64">
              <div
                className={`relative flex h-52 w-52 items-center justify-center rounded-full border shadow-xl sm:h-64 sm:w-64 ${
                  isDark
                    ? 'border-[#594477] bg-gradient-to-br from-[#604493]/40 via-[#25183D] to-[#10091F]'
                    : 'border-[#D8BFA3] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#D8BFA3]'
                }`}
              >
                <div className={`absolute inset-4 rounded-full border ${colors.border}`} />
                <div className={`absolute inset-8 rounded-full border ${colors.border}`} />

                <span className="text-8xl drop-shadow-lg sm:text-9xl">
                  🌙
                </span>

                <span className="absolute right-8 top-8 text-2xl text-amber-400">✦</span>
                <span className={`absolute bottom-10 left-8 text-xl ${colors.accent}`}>✧</span>
              </div>
            </div>
          </div>
        </section>

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
              {filteredStories.length} stories
            </span>
          </div>

          {filteredStories.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredStories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  isDark={isDark}
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
