
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import api from '../api/axios.js'
import { getFollowers } from '../utils/social.js'

function fixImageUrl(url) {
  if (!url) return ''

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.replace(
      'http://localhost/storage/',
      'http://127.0.0.1:8000/storage/',
    )
  }

  return `http://127.0.0.1:8000/storage/${url.replace(/^\/+/, '')}`
}

export default function Followers() {
  const { theme } = useOutletContext() || {}
  const isDark = theme === 'dark'

  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const colors = {
    page: isDark
      ? 'bg-[#10091F] text-[#F5EFFB]'
      : 'bg-[#F5EBDD] text-[#49372E]',
    hero: isDark
      ? 'border-[#3A2D50] bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
      : 'border-[#E7D9C9] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',
    eyebrow: isDark ? 'text-[#D6B779]' : 'text-[#A66B50]',
    heading: isDark ? 'text-[#F5EFFB]' : 'text-[#49372E]',
    accent: isDark ? 'text-[#D6B779]' : 'text-[#A66B50]',
    muted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    panel: isDark
      ? 'border-[#3A2D50] bg-[#25183D]'
      : 'border-[#E7D9C9] bg-[#FFF9F1]',
    card: isDark
      ? 'border-[#3A2D50] bg-[#1A122B] hover:border-[#8B6CCF]'
      : 'border-[#E7D9C9] bg-[#FFF9F1] hover:border-[#A66B50]',
    avatar: isDark
      ? 'border-[#3A2D50] bg-[#25183D]'
      : 'border-[#E7D9C9] bg-[#F5EBDD]',
    button: isDark
      ? 'border-[#8B6CCF]/40 text-[#D6B779] hover:bg-[#8B6CCF]/15'
      : 'border-[#E7D9C9] text-[#A66B50] hover:bg-[#F5EBDD]',
    link: isDark
      ? 'text-[#D6B779] hover:text-white'
      : 'text-[#A66B50] hover:text-[#49372E]',
    empty: isDark
      ? 'border-[#3A2D50] text-white'
      : 'border-[#E7D9C9] text-[#49372E]',
    emptyMuted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    primary: isDark
      ? 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'
      : 'bg-[#A66B50] text-white hover:bg-[#89543F]',
  }

  useEffect(() => {
    let mounted = true

    async function loadFollowers() {
      try {
        setLoading(true)
        setError('')

        const userResponse = await api.get('/user')
        const currentUser = userResponse.data?.user || userResponse.data

        if (!currentUser?.id) {
          throw new Error('Unable to find your account.')
        }

        const result = await getFollowers(currentUser.id)

        if (mounted) {
          setFollowers(Array.isArray(result) ? result : [])
        }
      } catch (err) {
        if (mounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Unable to load followers.',
          )
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadFollowers()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className={`min-h-screen p-4 sm:p-6 lg:p-8 ${colors.page}`}>
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <section
          className={`rounded-3xl border p-6 sm:p-8 ${colors.hero}`}
        >
          <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${colors.eyebrow}`}>
            Your Reading Community
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold sm:text-4xl ${colors.heading}`}>
                Followers
              </h1>
              <p className={`mt-2 ${colors.muted}`}>
                Readers who are following your journey.
              </p>
            </div>

            <div className={`rounded-2xl border px-6 py-4 text-center ${colors.panel}`}>
              <p className={`text-3xl font-bold ${colors.accent}`}>
                {followers.length}
              </p>
              <p className={`text-sm ${colors.muted}`}>
                Followers
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className={`rounded-3xl border p-5 sm:p-6 ${colors.panel}`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className={`text-xl font-bold ${colors.heading}`}>
              People Following You
            </h2>

            <Link
              to="/following"
              className={`text-sm font-semibold ${colors.link}`}
            >
              Following →
            </Link>
          </div>

          {loading ? (
            <p className={`py-10 text-center ${colors.muted}`}>
              Loading followers...
            </p>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-red-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className={`mt-4 rounded-xl px-5 py-2 text-sm font-semibold ${colors.primary}`}
              >
                Try Again
              </button>
            </div>
          ) : followers.length === 0 ? (
            <div className={`rounded-2xl border p-8 text-center ${colors.empty}`}>
              <div className="mb-3 text-4xl">🌙</div>
              <h3 className="text-lg font-bold">
                No Followers Yet
              </h3>
              <p className={`mt-2 text-sm ${colors.emptyMuted}`}>
                Keep sharing your stories. Your readers will find you!
              </p>
              <Link
                to="/explore"
                className={`mt-5 inline-block rounded-xl px-5 py-3 text-sm font-semibold ${colors.primary}`}
              >
                Explore Stories
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {followers.map((follower) => {
                const username = follower.username || ''
                const displayName =
                  follower.name || username || 'Reader'

                return (
                  <div
                    key={follower.id || username}
                    className={`flex items-center gap-4 rounded-2xl border p-4 transition ${colors.card}`}
                  >
                    <div
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-full border ${colors.avatar}`}
                    >
                      {follower.avatar ? (
                        <img
                          src={fixImageUrl(follower.avatar)}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className={`flex h-full w-full items-center justify-center text-xl font-bold ${colors.accent}`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className={`truncate font-bold ${colors.heading}`}>
                        {displayName}
                      </h3>

                      {username && (
                        <p className={`truncate text-sm ${colors.muted}`}>
                          @{username}
                        </p>
                      )}

                      <p className={`mt-1 line-clamp-2 text-xs ${colors.muted}`}>
                        {follower.bio || 'A Moonlit Pages reader.'}
                      </p>

                      {username && (
                        <Link
                          to={`/user/${encodeURIComponent(username)}`}
                          className={`mt-2 inline-block text-sm font-semibold ${colors.link}`}
                        >
                          View Profile →
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/profile"
            className={`rounded-xl border px-5 py-3 text-sm font-semibold ${colors.button}`}
          >
            My Profile
          </Link>

          <Link
            to="/explore"
            className={`rounded-xl px-5 py-3 text-sm font-semibold ${colors.primary}`}
          >
            Explore Stories
          </Link>
        </div>
      </div>
    </div>
  )
}
