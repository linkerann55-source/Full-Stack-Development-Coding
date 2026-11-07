
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getFollowing,
  toggleFollow,
  isFollowing,
  subscribeToFollowing,
} from '../utils/social.js'
import { addNotification } from '../utils/notifications.js'
import { getPublishedStories } from '../utils/stories.js'

const authors = [
  {
    username: 'Luna Rose',
    bio: 'Writing romance stories beneath the moonlight. ✨',
    genre: 'Fantasy',
    avatar: '🌙',
    stories: [
      {
        id: 'moonlit-promise',
        title: 'The Moonlit Promise',
        description: 'A mysterious promise made beneath the moon.',
      },
    ],
  },
  {
    username: 'Mira',
    bio: 'I write stories about love, friendship, and second chances. 🌸',
    genre: 'Romance',
    avatar: '🌸',
    stories: [
      {
        id: 'letters-to-you',
        title: 'Letters to You',
        description: 'Some letters are too important to leave unsent.',
      },
    ],
  },
  {
    username: 'Noah Grey',
    bio: 'Mysteries, dark secrets, and unexpected endings. 🖤',
    genre: 'Mystery',
    avatar: '🖤',
    stories: [
      {
        id: 'whispers-dark',
        title: 'Whispers in the Dark',
        description: 'Every secret leaves a trace.',
      },
    ],
  },
]

function getCurrentProfile() {
  try {
    return JSON.parse(
      localStorage.getItem('moonlit_pages_profile') || 'null',
    )
  } catch {
    return null
  }
}

export default function PublicProfile() {
  const { username } = useParams()

  const decodedUsername = decodeURIComponent(username || '')

  const author = authors.find(
    (item) =>
      item.username.toLowerCase() === decodedUsername.toLowerCase(),
  )

  const [following, setFollowing] = useState(() =>
    getFollowing().includes(author?.username),
  )

  const [publishedStories, setPublishedStories] = useState(() =>
    getPublishedStories(),
  )

  const [currentUser, setCurrentUser] = useState(getCurrentProfile)

  useEffect(() => {
    function updateFollowing() {
      setFollowing(
        author ? isFollowing(author.username) : false,
      )
    }

    function updateStories() {
      setPublishedStories(getPublishedStories())
    }

    function updateProfile() {
      setCurrentUser(getCurrentProfile())
    }

    updateFollowing()

    window.addEventListener('moonlit-auth-updated', updateProfile)
    window.addEventListener('moonlit-stories-updated', updateStories)
    window.addEventListener('storage', updateProfile)

    const unsubscribe = subscribeToFollowing(updateFollowing)

    return () => {
      window.removeEventListener(
        'moonlit-auth-updated',
        updateProfile,
      )
      window.removeEventListener(
        'moonlit-stories-updated',
        updateStories,
      )
      window.removeEventListener('storage', updateProfile)
      unsubscribe?.()
    }
  }, [author])

  if (!author) {
    return (
      <div className="min-h-screen bg-[#100b20] px-6 py-16 text-center text-white">
        <div className="mx-auto max-w-lg rounded-3xl border border-purple-400/20 bg-[#1b1230] p-10">
          <div className="mb-4 text-5xl">🌙</div>

          <h1 className="mb-3 text-2xl font-bold">
            Author Not Found
          </h1>

          <p className="mb-6 text-purple-200/70">
            This author profile could not be found.
          </p>

          <Link
            to="/explore"
            className="inline-block rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-500"
          >
            Explore Stories
          </Link>
        </div>
      </div>
    )
  }

  const isOwnProfile =
    currentUser?.username?.toLowerCase() ===
    author.username.toLowerCase()

  const authorStories = [
    ...author.stories,
    ...publishedStories
      .filter(
        (story) =>
          story.author?.toLowerCase() ===
            author.username.toLowerCase() &&
          !author.stories.some(
            (sample) => sample.id === story.id,
          ),
      )
      .map((story) => ({
        ...story,
        description: story.description || 'Read this story on Moonlit Pages.',
      })),
  ]

  function handleFollow() {
    if (!currentUser) {
      window.location.href = '/login'
      return
    }

    if (isOwnProfile) return

    const wasFollowing = isFollowing(author.username)

    toggleFollow(author.username)

    setFollowing(!wasFollowing)

    // Add a local prototype notification when following an author.
    if (!wasFollowing) {
      addNotification({
        type: 'follow',
        username: currentUser.username || 'Reader',
        avatar: currentUser.avatar || '🌙',
        message: 'started following',
        target: author.username,
        profileUsername: currentUser.username || '',
        storyId: '',
        time: 'Just now',
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#100b20] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/explore"
          className="mb-6 inline-flex items-center gap-2 text-sm text-purple-300 transition hover:text-white"
        >
          <span>←</span>
          Back to Explore
        </Link>

        <section className="relative overflow-hidden rounded-3xl border border-purple-400/20 bg-linear-to-br from-[#291747] via-[#1c1230] to-[#171027] p-6 shadow-2xl shadow-purple-950/30 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border border-purple-300/40 bg-purple-500/20 text-6xl shadow-lg shadow-purple-900/30">
              {author.avatar}
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-purple-300">
                Author Profile
              </p>

              <h1 className="text-3xl font-bold sm:text-4xl">
                {author.username}
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-purple-100/75">
                {author.bio}
              </p>

              <span className="mt-4 inline-block rounded-full border border-purple-300/20 bg-purple-400/10 px-4 py-1.5 text-sm text-purple-200">
                {author.genre}
              </span>

              <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
                {!isOwnProfile && (
                  <button
                    type="button"
                    onClick={handleFollow}
                    className={`rounded-xl px-6 py-3 font-semibold transition ${
                      following
                        ? 'border border-purple-300/30 bg-purple-950/50 text-purple-200 hover:border-pink-300/40 hover:text-pink-200'
                        : 'bg-linear-to-r from-purple-600 to-violet-500 text-white shadow-lg shadow-purple-900/30 hover:from-purple-500 hover:to-violet-400'
                    }`}
                  >
                    {following
                      ? '✓ Following · Unfollow'
                      : '+ Follow Author'}
                  </button>
                )}

                <Link
                  to="/explore"
                  className="rounded-xl border border-purple-300/20 bg-white/5 px-6 py-3 font-semibold text-purple-100 transition hover:bg-white/10"
                >
                  Explore Stories
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                Stories by {author.username}
              </h2>

              <p className="mt-2 text-sm text-purple-200/60">
                Discover stories from this author.
              </p>
            </div>

            <span className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1.5 text-sm text-purple-200">
              {authorStories.length} stories
            </span>
          </div>

          {authorStories.length === 0 ? (
            <div className="rounded-2xl border border-purple-400/15 bg-[#1b1230] px-6 py-12 text-center">
              <div className="mb-3 text-4xl">📚</div>

              <h3 className="text-lg font-semibold">
                No stories yet
              </h3>

              <p className="mt-2 text-sm text-purple-200/60">
                This author has not published any stories yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {authorStories.map((story) => (
                <article
                  key={story.id}
                  className="group rounded-2xl border border-purple-400/15 bg-[#1b1230] p-5 transition hover:-translate-y-1 hover:border-purple-400/40 hover:shadow-xl hover:shadow-purple-950/30"
                >
                  <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-linear-to-br from-purple-800/50 to-indigo-950/70 text-5xl">
                    {author.avatar}
                  </div>

                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-300">
                    {author.genre}
                  </p>

                  <h3 className="text-lg font-bold transition group-hover:text-purple-300">
                    {story.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-purple-100/60">
                    {story.description}
                  </p>

                  <Link
                    to={`/reader?story=${encodeURIComponent(story.id)}`}
                    className="mt-5 inline-flex items-center gap-2 font-semibold text-purple-300 transition hover:text-white"
                  >
                    Read Story <span>→</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
