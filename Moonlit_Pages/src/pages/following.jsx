
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getFollowing,
  toggleFollow,
  subscribeToFollowing,
} from '../utils/social.js'

const authors = [
  {
    username: 'Luna Rose',
    bio: 'Writing romance stories beneath the moonlight. ✨',
    genre: 'Romance',
    avatar: '🌙',
    stories: ['Under the Moonlight', 'A Thousand Stars'],
  },
  {
    username: 'Violet Dreams',
    bio: 'Creating magical worlds and unforgettable characters. 💜',
    genre: 'Fantasy',
    avatar: '🦋',
    stories: ['The Hidden Kingdom'],
  },
  {
    username: 'Midnight Writer',
    bio: 'Mystery, secrets, and stories that keep you guessing.',
    genre: 'Mystery',
    avatar: '🖋️',
    stories: ['Secrets After Dark'],
  },
]

function Following() {
  const [following, setFollowing] = useState([])

  useEffect(() => {
    function refreshFollowing() {
      setFollowing(getFollowing())
    }

    refreshFollowing()

    return subscribeToFollowing(refreshFollowing)
  }, [])

  function handleUnfollow(username) {
    toggleFollow(username)
    setFollowing(getFollowing())
  }

  function getAuthor(username) {
    return (
      authors.find(
        (author) =>
          author.username.toLowerCase() ===
          String(username).toLowerCase()
      ) || {
        username,
        bio: 'A member of the Moonlit Pages community.',
        genre: 'Stories',
        avatar: '✍️',
        stories: [],
      }
    )
  }

  return (
    <main className="min-h-screen bg-[#100b1c] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl border border-violet-400/20 bg-linear-to-br from-[#32175c] via-[#21113e] to-[#10091f] p-7 sm:p-9">
          <p className="text-xs font-semibold tracking-[0.25em] text-violet-300">
            YOUR MOONLIT COMMUNITY
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Following Authors <span className="text-violet-300">✦</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-violet-100/70">
            Keep up with your favorite writers and discover
            the stories they share.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
            <span>♥</span>
            {following.length}{' '}
            {following.length === 1 ? 'author' : 'authors'} followed
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-violet-400/15 bg-[#1a1229] p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              Your Following List
            </h2>

            <Link
              to="/explore"
              className="text-sm text-violet-300 transition hover:text-white"
            >
              Discover Stories →
            </Link>
          </div>

          {following.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-violet-300/20 px-5 py-12 text-center">
              <div className="text-5xl">🌙</div>

              <h3 className="mt-4 text-lg font-semibold">
                Your reading circle is waiting
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-violet-100/60">
                You haven't followed any authors yet. Explore
                stories and follow writers whose work you enjoy.
              </p>

              <Link
                to="/explore"
                className="mt-6 inline-flex rounded-xl bg-linear-to-r from-purple-600 to-violet-500 px-6 py-3 font-semibold transition hover:brightness-110"
              >
                Explore Stories ✦
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {following.map((username) => {
                const author = getAuthor(username)

                return (
                  <article
                    key={username.toLowerCase()}
                    className="rounded-2xl border border-violet-400/15 bg-[#211632] p-5 transition hover:border-violet-400/40"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-3xl">
                        {author.avatar}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/user/${encodeURIComponent(author.username)}`}
                          className="wrap-break-word text-lg font-semibold transition hover:text-violet-300"
                        >
                          {author.username}
                        </Link>

                        <p className="mt-1 text-xs text-violet-300">
                          {author.genre}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-violet-100/60">
                          {author.bio}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-violet-400/10 pt-4">
                      <h3 className="mb-3 text-sm font-semibold text-violet-100">
                        Stories
                      </h3>

                      {author.stories.length > 0 ? (
                        <div className="space-y-2">
                          {author.stories.map((story) => (
                            <Link
                              key={story}
                              to="/reader"
                              className="flex items-center gap-3 rounded-xl bg-[#2a1d3d] p-3 transition hover:bg-[#352448]"
                            >
                              <span className="text-xl">📖</span>
                              <span className="flex-1 text-sm">
                                {story}
                              </span>
                              <span className="text-violet-300">→</span>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl bg-[#2a1d3d] p-3 text-sm text-violet-200/50">
                          No story previews available yet.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 flex gap-3">
                      <Link
                        to={`/user/${encodeURIComponent(author.username)}`}
                        className="flex-1 rounded-xl border border-violet-400/30 px-3 py-2.5 text-center text-sm text-violet-200 transition hover:bg-violet-500/10"
                      >
                        View Profile
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleUnfollow(username)}
                        className="flex-1 rounded-xl bg-violet-500/15 px-3 py-2.5 text-sm text-violet-200 transition hover:bg-red-500/15 hover:text-red-300"
                      >
                        Unfollow
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-4 border-t border-violet-400/10 pt-6">
          <Link
            to="/profile"
            className="text-sm text-violet-300 transition hover:text-white"
          >
            ← My Profile
          </Link>

          <Link
            to="/explore"
            className="text-sm text-violet-300 transition hover:text-white"
          >
            Explore Stories →
          </Link>
        </div>

        <p className="mt-6 text-xs leading-5 text-violet-100/40">
          Following information is stored locally in this browser.
        </p>
      </div>
    </main>
  )
}

export default Following
