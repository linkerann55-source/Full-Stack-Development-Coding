
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getFollowers,
  subscribeToFollowing,
} from '../utils/social.js'

const PROFILE_KEY = 'moonlit_pages_profile'

const AUTHOR_DETAILS = {
  'luna rose': {
    avatar: '🌙',
    bio: 'Writing romance stories beneath the moonlight.',
  },
  mira: {
    avatar: '🌸',
    bio: 'Turning little moments into beautiful stories.',
  },
  'noah grey': {
    avatar: '🖤',
    bio: 'Mystery, secrets, and stories after dark.',
  },
}

function Followers() {
  const [username, setUsername] = useState('Moonlight Reader')
  const [followers, setFollowers] = useState([])

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(PROFILE_KEY) || 'null'
      )

      if (
        typeof saved?.username === 'string' &&
        saved.username.trim()
      ) {
        setUsername(saved.username.trim())
      }
    } catch {
      setUsername('Moonlight Reader')
    }
  }, [])

  useEffect(() => {
    function refreshFollowers() {
      setFollowers(getFollowers(username))
    }

    refreshFollowers()
    return subscribeToFollowing(refreshFollowers)
  }, [username])

  return (
    <div className="min-h-screen space-y-7 text-white">
      {/* Page heading */}
      <section className="rounded-3xl border border-purple-400/20 bg-linear-to-br from-[#32175c] via-[#21113e] to-[#10091f] p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-purple-300">
          Your Moonlit Community
        </p>

        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Your <span className="text-purple-300">Followers</span> ✦
        </h1>

        <p className="mt-3 text-purple-100/70">
          Readers who are following {username}.
        </p>

        <div className="mt-6">
          <span className="text-4xl font-bold text-purple-200">
            {followers.length}
          </span>
          <span className="ml-2 text-purple-200/60">
            {followers.length === 1 ? 'follower' : 'followers'}
          </span>
        </div>
      </section>

      {/* Followers list */}
      <section className="rounded-3xl border border-purple-400/15 bg-[#1b1030] p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">
            People Following You
          </h2>

          <Link
            to="/following"
            className="text-sm text-purple-300 transition hover:text-purple-200"
          >
            View Following →
          </Link>
        </div>

        {followers.length > 0 ? (
          <div className="space-y-3">
            {followers.map((follower) => {
              const details =
                AUTHOR_DETAILS[follower.toLowerCase()] || {
                  avatar: '🌙',
                  bio: 'A reader in the Moonlit Pages community.',
                }

              return (
                <article
                  key={follower.toLowerCase()}
                  className="flex flex-col gap-4 rounded-2xl border border-purple-300/10 bg-white/0.03 p-4 transition hover:border-purple-300/30 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-purple-300/20 bg-linear-to-br from-purple-500/30 to-indigo-800/40 text-2xl">
                      {details.avatar}
                    </div>

                    <div className="min-w-0">
                      <h3 className="wrap-break-word font-semibold">
                        {follower}
                      </h3>
                      <p className="mt-1 text-sm text-purple-100/60">
                        {details.bio}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/user/${encodeURIComponent(follower)}`}
                    className="rounded-full border border-purple-300/30 px-5 py-2 text-center text-sm font-medium text-purple-200 transition hover:bg-purple-500/15"
                  >
                    View Profile
                  </Link>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-purple-300/20 px-5 py-12 text-center">
            <div className="text-5xl">🌙</div>

            <h3 className="mt-4 text-lg font-semibold">
              Your story is just beginning
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-purple-100/60">
              You don't have any followers yet. Keep sharing stories
              and connecting with readers to grow your community.
            </p>

            <Link
              to="/explore"
              className="mt-6 inline-flex rounded-full bg-linear-to-r from-purple-600 to-violet-400 px-6 py-3 font-semibold transition hover:brightness-110"
            >
              Explore Stories ✦
            </Link>
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-purple-100/40">
        Follower information is stored locally in this demo.
        A real multi-user follower system requires a backend and database.
      </p>
    </div>
  )
}

export default Followers
