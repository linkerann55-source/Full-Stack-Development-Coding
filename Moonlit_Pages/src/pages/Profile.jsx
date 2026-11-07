import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { getCurrentUser } from '../utils/auth.js'
import { getFollowers, getFollowing } from '../utils/social.js'
import { getProfile, updateProfile } from '../api/profile.js'
import { getMyStories, deleteStory } from '../api/stories.js'

const PROFILE_KEY = 'moonlit_pages_profile'
const POSTS_KEY = 'moonlit_pages_profile_posts'
const POLLS_KEY = 'moonlit_pages_profile_polls'

const defaultProfile = {
  username: 'Moonlight Reader',
  bio: 'Lost in stories, found among the stars. ✨',
  favoriteGenre: 'Fantasy',
  avatar: '',
  coverPhoto: '',
}

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function initials(username) {
  return (username || 'Reader')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('')
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function Avatar({ src, username, size = 'h-12 w-12' }) {
  return src ? (
    <img
      src={src}
      alt={`${username}'s avatar`}
      className={`${size} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-indigo-700 font-bold text-white`}
    >
      {initials(username)}
    </div>
  )
}

function getStoryList(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.stories)) return result.stories
  if (Array.isArray(result?.data)) return result.data
  return []
}

export default function Profile() {
  const { theme } = useOutletContext() || {}
  const isLight = theme === 'light' || theme === 'day'

  const [user, setUser] = useState(() => {
    return getCurrentUser() || { username: 'Moonlight Reader' }
  })

  const [profile, setProfile] = useState(() => ({
    ...defaultProfile,
    ...(readJSON(PROFILE_KEY, {}) || {}),
  }))

  const [photoFiles, setPhotoFiles] = useState({
    avatar: null,
    coverPhoto: null,
  })

  const [myStories, setMyStories] = useState([])
  const [loadingStories, setLoadingStories] = useState(true)

  const [followingCount, setFollowingCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)

  const [tab, setTab] = useState('conversations')
  const [editing, setEditing] = useState(false)
  const [aboutModal, setAboutModal] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [message, setMessage] = useState('')

  const [posts, setPosts] = useState(() =>
    readJSON(POSTS_KEY, []),
  )

  const [polls, setPolls] = useState(() =>
    readJSON(POLLS_KEY, []),
  )

  const [postText, setPostText] = useState('')
  const [editingPostId, setEditingPostId] = useState(null)
  const [editPostText, setEditPostText] = useState('')

  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [replyInputs, setReplyInputs] = useState({})
  const [showPollForm, setShowPollForm] = useState(false)

  const page = isLight
    ? 'text-[#49372E]'
    : 'text-[#F5EFFB]'

  const muted = isLight
    ? 'text-[#88796F]'
    : 'text-[#B9ADC9]'

  const panel = isLight
    ? 'border-[#D8E7F5] bg-white/90'
    : 'border-[#3A2D50] bg-[#25183D]/90'

  const border = isLight
    ? 'border-[#D8E7F5]'
    : 'border-[#3A2D50]'

  const input = isLight
    ? 'border-[#D8E7F5] bg-[#F7FBFF] text-[#263B55] placeholder:text-[#91A3B8] focus:border-blue-400'
    : 'border-[#49385F] bg-[#170F27] text-[#F5EFFB] placeholder:text-[#88799B] focus:border-[#A78BFA]'

  const accent = isLight
    ? 'text-blue-600'
    : 'text-[#D6B779]'

  const primaryButton = isLight
    ? 'bg-blue-600 text-white hover:bg-blue-700'
    : 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'

  const softBackground = isLight
    ? 'bg-white/60'
    : 'bg-black/20'
  // Load profile from Laravel
  async function loadProfile() {
    try {
      const currentUser = getCurrentUser()
      const saved = readJSON(PROFILE_KEY, {})

      const serverProfile = await getProfile()

      const registeredName =
        serverProfile?.name ||
        currentUser?.name ||
        currentUser?.username ||
        'Moonlight Reader'

      setUser(currentUser || {})

      setProfile({
        ...defaultProfile,
        ...saved,
        username: registeredName,
        bio: serverProfile?.bio ?? saved?.bio ?? defaultProfile.bio,
        favoriteGenre:
          serverProfile?.favorite_genre ||
          saved?.favoriteGenre ||
          'Fantasy',
        avatar: serverProfile?.avatar || '',
        coverPhoto: serverProfile?.cover_photo || '',
      })

      try {
        setFollowingCount(getFollowing().length)
        setFollowersCount(getFollowers(registeredName).length)
      } catch {
        setFollowingCount(0)
        setFollowersCount(0)
      }
    } catch (error) {
      console.error('Profile loading error:', error)

      const currentUser = getCurrentUser()
      const saved = readJSON(PROFILE_KEY, {})

      setUser(currentUser || {})
      setProfile({
        ...defaultProfile,
        ...saved,
        username:
          currentUser?.name ||
          currentUser?.username ||
          saved?.username ||
          'Moonlight Reader',
      })

      setMessage('Unable to load the latest profile information.')
    }
  }

  // Load stories written by the logged-in user
  async function loadMyStories() {
    setLoadingStories(true)

    try {
      const result = await getMyStories()
      setMyStories(getStoryList(result))
    } catch (error) {
      console.error('Loading stories error:', error)
      setMyStories([])
    } finally {
      setLoadingStories(false)
    }
  }

  function refreshPosts() {
    setPosts(readJSON(POSTS_KEY, []))
    setPolls(readJSON(POLLS_KEY, []))
  }

  useEffect(() => {
    loadProfile()
    loadMyStories()
    refreshPosts()

    const refresh = () => {
      loadProfile()
      loadMyStories()
      refreshPosts()
    }

    window.addEventListener('storage', refresh)
    window.addEventListener('moonlit-auth-updated', refresh)
    window.addEventListener('moonlit-profile-updated', refresh)
    window.addEventListener('moonlit-following-updated', refresh)

    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('moonlit-auth-updated', refresh)
      window.removeEventListener('moonlit-profile-updated', refresh)
      window.removeEventListener('moonlit-following-updated', refresh)
    }
  }, [])

  function handleProfileChange(event) {
    const { name, value } = event.target

    setProfile((current) => ({
      ...current,
      [name]: value,
    }))
  }

  // Preview selected image and keep the original file for uploading
  function handlePhotoUpload(event, field) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file.')
      event.target.value = ''
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage('Please choose an image smaller than 2 MB.')
      event.target.value = ''
      return
    }

    const preview = URL.createObjectURL(file)

    setPhotoFiles((current) => ({
      ...current,
      [field]: file,
    }))

    setProfile((current) => ({
      ...current,
      [field]: preview,
    }))

    setMessage('')
  }

  // Save profile information and photos to Laravel
  async function saveProfile(event) {
    event.preventDefault()

    setSavingProfile(true)
    setMessage('')

    try {
      const updated = await updateProfile({
        bio: profile.bio.trim(),
        favoriteGenre: profile.favoriteGenre.trim(),
        avatar: photoFiles.avatar,
        coverPhoto: photoFiles.coverPhoto,
      })

      const nextProfile = {
        ...profile,
        username: updated.name || profile.username,
        bio: updated.bio || '',
        favoriteGenre: updated.favorite_genre || 'Fantasy',
        avatar: updated.avatar || '',
        coverPhoto: updated.cover_photo || '',
      }

      setProfile(nextProfile)
      setPhotoFiles({
        avatar: null,
        coverPhoto: null,
      })

      saveJSON(PROFILE_KEY, nextProfile)

      setUser((current) => ({
        ...current,
        name: updated.name || current?.name,
        username: updated.name || current?.username,
      }))

      setEditing(false)
      setAboutModal(false)
      setMessage('Profile updated successfully.')

      window.dispatchEvent(new Event('moonlit-profile-updated'))
    } catch (error) {
      console.error('Profile update error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to update your profile. Please try again.',
      )
    } finally {
      setSavingProfile(false)
    }
  }

  // Reset unsaved photo previews
  function cancelProfileEdit() {
    setPhotoFiles({
      avatar: null,
      coverPhoto: null,
    })

    setEditing(false)
    loadProfile()
  }

  // Delete a story
  async function removeMyStory(storyId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this story?',
    )

    if (!confirmed) return

    try {
      await deleteStory(storyId)

      setMyStories((current) =>
        current.filter((story) => story.id !== storyId),
      )

      setMessage('Story deleted successfully.')
    } catch (error) {
      console.error('Delete story error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to delete this story.',
      )
    }
  }

  // Create a conversation
  function createPost(event) {
    event.preventDefault()

    const text = postText.trim()
    if (!text) return

    const nextPosts = [
      {
        id: makeId(),
        username: profile.username,
        avatar: profile.avatar || '',
        text,
        createdAt: new Date().toISOString(),
        replies: [],
      },
      ...posts,
    ]

    if (!saveJSON(POSTS_KEY, nextPosts)) {
      setMessage('Could not save your post.')
      return
    }

    setPosts(nextPosts)
    setPostText('')
    setMessage('')
  }

  // Edit a conversation
  function startEditPost(post) {
    setEditingPostId(post.id)
    setEditPostText(post.text)
  }

  function saveEditedPost(event, postId) {
    event.preventDefault()

    const text = editPostText.trim()
    if (!text) return

    const nextPosts = posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            text,
            updatedAt: new Date().toISOString(),
          }
        : post,
    )

    if (saveJSON(POSTS_KEY, nextPosts)) {
      setPosts(nextPosts)
      setEditingPostId(null)
      setEditPostText('')
    }
  }

  function deletePost(postId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this conversation?',
    )

    if (!confirmed) return

    const nextPosts = posts.filter((post) => post.id !== postId)

    if (saveJSON(POSTS_KEY, nextPosts)) {
      setPosts(nextPosts)
    }
  }

  // Reply to a conversation
  function addReply(event, postId) {
    event.preventDefault()

    const text = (replyInputs[postId] || '').trim()
    if (!text) return

    const nextPosts = posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            replies: [
              ...(post.replies || []),
              {
                id: makeId(),
                username: profile.username,
                avatar: profile.avatar || '',
                text,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : post,
    )

    if (saveJSON(POSTS_KEY, nextPosts)) {
      setPosts(nextPosts)

      setReplyInputs((current) => ({
        ...current,
        [postId]: '',
      }))
    }
  }

  // Create a poll
  function createPoll(event) {
    event.preventDefault()

    const question = pollQuestion.trim()

    const options = pollOptions
      .map((option) => option.trim())
      .filter(Boolean)

    if (!question || options.length < 2) {
      setMessage('Enter a question and at least two options.')
      return
    }

    const nextPolls = [
      {
        id: makeId(),
        username: profile.username,
        avatar: profile.avatar || '',
        question,
        options: options.map((text) => ({
          id: makeId(),
          text,
          votes: [],
        })),
        replies: [],
        createdAt: new Date().toISOString(),
      },
      ...polls,
    ]

    if (saveJSON(POLLS_KEY, nextPolls)) {
      setPolls(nextPolls)
      setPollQuestion('')
      setPollOptions(['', ''])
      setShowPollForm(false)
      setMessage('')
      setTab('polls')
    }
  }

  // Vote on a poll
  function votePoll(pollId, optionId) {
    const nextPolls = polls.map((poll) => {
      if (poll.id !== pollId) return poll

      const alreadyVoted = poll.options.some((option) =>
        option.votes.includes(profile.username),
      )

      if (alreadyVoted) {
        return {
          ...poll,
          options: poll.options.map((option) => ({
            ...option,
            votes:
              option.id === optionId
                ? option.votes.filter(
                    (name) => name !== profile.username,
                  )
                : option.votes,
          })),
        }
      }

      return {
        ...poll,
        options: poll.options.map((option) =>
          option.id === optionId
            ? {
                ...option,
                votes: [...option.votes, profile.username],
              }
            : option,
        ),
      }
    })

    if (saveJSON(POLLS_KEY, nextPolls)) {
      setPolls(nextPolls)
    }
  }

  // Reply to a poll
  function addPollReply(event, pollId) {
    event.preventDefault()

    const text = (replyInputs[pollId] || '').trim()
    if (!text) return

    const nextPolls = polls.map((poll) =>
      poll.id === pollId
        ? {
            ...poll,
            replies: [
              ...(poll.replies || []),
              {
                id: makeId(),
                username: profile.username,
                text,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : poll,
    )

    if (saveJSON(POLLS_KEY, nextPolls)) {
      setPolls(nextPolls)

      setReplyInputs((current) => ({
        ...current,
        [pollId]: '',
      }))
    }
  }

  function deletePoll(pollId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this poll?',
    )

    if (!confirmed) return

    const nextPolls = polls.filter((poll) => poll.id !== pollId)

    if (saveJSON(POLLS_KEY, nextPolls)) {
      setPolls(nextPolls)
    }
  }

  function updatePollOption(index, value) {
    setPollOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    )
  }

  function addPollOption() {
    if (pollOptions.length < 6) {
      setPollOptions((current) => [...current, ''])
    }
  }

  function removePollOption(index) {
    if (pollOptions.length <= 2) return

    setPollOptions((current) =>
      current.filter((_, optionIndex) => optionIndex !== index),
    )
  }

  function formatDate(date) {
    if (!date) return 'Just now'

    const elapsed = Date.now() - new Date(date).getTime()

    if (!Number.isFinite(elapsed) || elapsed < 60000) {
      return 'Just now'
    }

    if (elapsed < 3600000) {
      return `${Math.floor(elapsed / 60000)}m ago`
    }

    if (elapsed < 86400000) {
      return `${Math.floor(elapsed / 3600000)}h ago`
    }

    return new Date(date).toLocaleDateString()
  }

  const tabs = [
    { id: 'conversations', label: 'Conversations' },
    { id: 'polls', label: 'Polls' },
    { id: 'about', label: 'About' },
  ]

  return (
      <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${page} bg-transparent`}>
      <div className="mx-auto max-w-5xl">

        {/* Page heading */}
        <div className="mb-7">
          <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${accent}`}>
            Your personal space
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            My Profile
          </h1>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${panel}`}>
            {message}
          </div>
        )}

        {/* Profile header */}
        <section className={`overflow-hidden rounded-3xl border ${panel}`}>

          {/* Cover photo */}
          <div
            className="h-36 bg-linear-to-r from-indigo-950 via-purple-800 to-[#39204d] bg-cover bg-center sm:h-48"
            style={
              profile.coverPhoto
                ? { backgroundImage: `url("${profile.coverPhoto}")` }
                : undefined
            }
          />

          <div className="px-5 pb-6 sm:px-8">

            <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">

              <div className="flex items-end gap-4">

                <div
                  className={`rounded-full border-4 ${
                    isLight
                      ? 'border-white'
                      : 'border-[#25183D]'
                  }`}
                >
                  <Avatar
                    src={profile.avatar}
                    username={profile.username}
                    size="h-24 w-24 sm:h-32 sm:w-32"
                  />
                </div>

                <div className="pb-1">
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    {profile.username}
                  </h2>

                  <p className={`mt-1 text-sm ${muted}`}>
                    {user?.email || 'Moonlit Pages member'} ✦
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setMessage('')
                  setEditing((current) => !current)
                }}
                className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${border} hover:opacity-80`}
              >
                {editing ? 'Close Editor' : '✎ Edit Profile'}
              </button>

            </div>

            {!editing && (
              <p className={`mt-5 max-w-2xl whitespace-pre-wrap leading-7 ${muted}`}>
                {profile.bio || 'This reader has not added a bio yet.'}
              </p>
            )}

            {/* Followers */}
            <div className="mt-6 flex flex-wrap gap-6">

              <Link to="/followers" className="hover:opacity-75">
                <span className="font-bold">{followersCount}</span>{' '}
                <span className={muted}>Followers</span>
              </Link>

              <Link to="/following" className="hover:opacity-75">
                <span className="font-bold">{followingCount}</span>{' '}
                <span className={muted}>Following</span>
              </Link>

              <Link to="/library" className="hover:opacity-75">
                <span className="font-bold">♡</span>{' '}
                <span className={muted}>My Library</span>
              </Link>

            </div>

            {/* Profile editor */}
            {editing && (
              <form
                onSubmit={saveProfile}
                className="mt-7 space-y-6"
              >

                {/* Avatar upload */}
                <div>
                  <label
                    htmlFor="avatarUpload"
                    className="mb-3 block text-sm font-semibold"
                  >
                    Profile Picture
                  </label>

                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar
                      src={profile.avatar}
                      username={profile.username}
                      size="h-20 w-20"
                    />

                    <input
                      id="avatarUpload"
                      type="file"
                      accept="image/*"
                      onChange={(event) =>
                        handlePhotoUpload(event, 'avatar')
                      }
                      className="block w-full min-w-0 flex-1 text-sm"
                    />
                  </div>

                  <p className={`mt-2 text-xs ${muted}`}>
                    Maximum image size: 2 MB.
                  </p>
                </div>

                {/* Cover upload */}
                <div className={`rounded-2xl border p-5 ${softBackground} ${border}`}>
                  <label
                    htmlFor="coverUpload"
                    className="mb-3 block text-sm font-semibold"
                  >
                    Cover Photo
                  </label>

                  {profile.coverPhoto && (
                    <img
                      src={profile.coverPhoto}
                      alt="Cover preview"
                      className="mb-4 h-40 w-full rounded-xl object-cover"
                    />
                  )}

                  <input
                    id="coverUpload"
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      handlePhotoUpload(event, 'coverPhoto')
                    }
                    className="block w-full text-sm"
                  />

                  <p className={`mt-2 text-xs ${muted}`}>
                    Maximum image size: 2 MB.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className={`rounded-xl px-6 py-3 font-semibold disabled:opacity-50 ${primaryButton}`}
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>

                  <button
                    type="button"
                    onClick={cancelProfileEdit}
                    className={`rounded-xl border px-6 py-3 font-semibold ${border}`}
                  >
                    Cancel
                  </button>
                </div>

              </form>
            )}

          </div>
        </section>

        {/* Tabs */}
        <nav className={`mt-7 flex flex-wrap gap-2 border-b pb-3 ${border}`}>
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                tab === item.id
                  ? primaryButton
                  : `${muted} hover:opacity-75`
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* ABOUT TAB */}
        {tab === 'about' && (
          <section className={`mt-6 rounded-2xl border p-6 ${panel}`}>

            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">About Me</h2>

              <button
                type="button"
                onClick={() => setAboutModal(true)}
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${primaryButton}`}
              >
                ✎ Edit About
              </button>
            </div>

            <div className={`mt-5 rounded-xl border p-4 ${border}`}>
              <h3 className="font-semibold">Account Information</h3>

              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <p className={muted}>Registered name</p>
                  <p className="font-medium">
                    {user?.name || user?.username || 'Not available'}
                  </p>
                </div>

                <div>
                  <p className={muted}>Email address</p>
                  <p className="font-medium">
                    {user?.email || 'Not available'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className={`text-sm font-semibold ${muted}`}>
                About me
              </p>

              <p className="mt-2 whitespace-pre-wrap leading-7">
                {profile.bio || 'No bio added yet.'}
              </p>
            </div>

            <div className={`mt-5 rounded-xl border p-4 ${border}`}>
              <p className={`text-sm ${muted}`}>
                Favourite genre
              </p>

              <p className="mt-1 font-semibold">
                ✦ {profile.favoriteGenre || 'Not set'}
              </p>
            </div>

          </section>
        )}

        {/* CONVERSATIONS TAB */}
        {tab === 'conversations' && (
          <section className="mt-6 space-y-5">

            {/* Create post */}
            <form
              onSubmit={createPost}
              className={`rounded-2xl border p-5 sm:p-6 ${panel}`}
            >
              <div className="flex gap-3">

                <Avatar
                  src={profile.avatar}
                  username={profile.username}
                />

                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="postText"
                    className="mb-2 block font-semibold"
                  >
                    Start a conversation
                  </label>

                  <textarea
                    id="postText"
                    rows={3}
                    maxLength={2000}
                    value={postText}
                    onChange={(event) =>
                      setPostText(event.target.value)
                    }
                    placeholder="What's on your mind, reader?"
                    className={`w-full resize-y rounded-xl border px-4 py-3 outline-none ${input}`}
                  />

                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={!postText.trim()}
                      className={`rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${primaryButton}`}
                    >
                      Publish Post
                    </button>
                  </div>
                </div>

              </div>
            </form>

            {posts.length === 0 && (
              <div className={`rounded-2xl border border-dashed p-10 text-center ${border}`}>
                <div className="text-4xl">💬</div>

                <h3 className="mt-3 text-lg font-bold">
                  Start your first conversation
                </h3>

                <p className={`mt-2 text-sm ${muted}`}>
                  Share your thoughts about books, writing, or everyday life.
                </p>
              </div>
            )}

            {/* Posts */}
            {posts.map((post) => (
              <article
                key={post.id}
                className={`rounded-2xl border p-5 sm:p-6 ${panel}`}
              >
                <div className="flex items-start gap-3">

                  <Avatar
                    src={post.avatar}
                    username={post.username}
                  />

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center justify-between gap-2">

                      <div>
                        <p className="font-semibold">
                          {post.username}
                        </p>

                        <p className={`text-xs ${muted}`}>
                          {formatDate(post.createdAt)}
                          {post.updatedAt ? ' · Edited' : ''}
                        </p>
                      </div>

                  {post.username?.toLowerCase() === profile.username.toLowerCase() && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditPost(post)}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold ${border} hover:opacity-70`}
                      >
                        ✎ Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePost(post.id)}
                        className="rounded-lg border border-red-400 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  )}

                    </div>

                    {/* Edit post */}
                    {editingPostId === post.id ? (
                      <form
                        onSubmit={(event) =>
                          saveEditedPost(event, post.id)
                        }
                        className="mt-4 space-y-3"
                      >
                        <textarea
                          value={editPostText}
                          onChange={(event) =>
                            setEditPostText(event.target.value)
                          }
                          maxLength={2000}
                          rows={4}
                          className={`w-full rounded-xl border px-4 py-3 outline-none ${input}`}
                        />

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={!editPostText.trim()}
                            className={`rounded-lg px-4 py-2 text-sm ${primaryButton}`}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPostId(null)
                              setEditPostText('')
                            }}
                            className={`rounded-lg border px-4 py-2 text-sm ${border}`}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="mt-4 whitespace-pre-wrap break-words leading-7">
                        {post.text}
                      </p>
                    )}

                    {/* Replies */}
                    <div className={`mt-5 border-t pt-4 ${border}`}>
                      <p className={`mb-3 text-sm font-semibold ${muted}`}>
                        Replies ({post.replies?.length || 0})
                      </p>

                      <div className="space-y-3">
                        {(post.replies || []).map((reply) => (
                          <div key={reply.id} className="flex gap-2">

                            <Avatar
                              src={reply.avatar}
                              username={reply.username}
                              size="h-8 w-8"
                            />

                            <div className={`min-w-0 flex-1 rounded-xl px-3 py-2 ${softBackground}`}>
                              <p className="text-sm font-semibold">
                                {reply.username}
                              </p>

                              <p className="mt-1 break-words text-sm">
                                {reply.text}
                              </p>

                              <p className={`mt-1 text-xs ${muted}`}>
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>

                          </div>
                        ))}
                      </div>

                      <form
                        onSubmit={(event) =>
                          addReply(event, post.id)
                        }
                        className="mt-4 flex gap-2"
                      >
                        <input
                          value={replyInputs[post.id] || ''}
                          onChange={(event) =>
                            setReplyInputs((current) => ({
                              ...current,
                              [post.id]: event.target.value,
                            }))
                          }
                          placeholder="Write a reply..."
                          maxLength={500}
                          className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${input}`}
                        />

                        <button
                          type="submit"
                          disabled={!(replyInputs[post.id] || '').trim()}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${primaryButton}`}
                        >
                          Reply
                        </button>
                      </form>

                    </div>

                  </div>
                </div>
              </article>
            ))}

          </section>
        )}

        {/* POLLS TAB */}
        {tab === 'polls' && (
          <section className="mt-6 space-y-5">

            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 ${panel}`}>
              <div>
                <h2 className="text-xl font-bold">
                  Community Polls
                </h2>

                <p className={`mt-1 text-sm ${muted}`}>
                  Ask readers a question and see what they choose.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowPollForm((current) => !current)
                }
                className={`rounded-xl px-5 py-3 text-sm font-semibold ${primaryButton}`}
              >
                {showPollForm ? 'Cancel' : '+ Create Poll'}
              </button>
            </div>

            {/* Poll creation form */}
            {showPollForm && (
              <form
                onSubmit={createPoll}
                className={`space-y-4 rounded-2xl border p-5 ${panel}`}
              >
                <div>
                  <label
                    htmlFor="pollQuestion"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Poll question
                  </label>

                  <input
                    id="pollQuestion"
                    value={pollQuestion}
                    onChange={(event) =>
                      setPollQuestion(event.target.value)
                    }
                    maxLength={250}
                    placeholder="Which genre do you enjoy most?"
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${input}`}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">
                    Options
                  </p>

                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={option}
                        onChange={(event) =>
                          updatePollOption(index, event.target.value)
                        }
                        maxLength={100}
                        placeholder={`Option ${index + 1}`}
                        className={`min-w-0 flex-1 rounded-xl border px-4 py-3 outline-none ${input}`}
                      />

                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePollOption(index)}
                          className={`px-3 ${muted}`}
                          aria-label={`Remove option ${index + 1}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={addPollOption}
                    disabled={pollOptions.length >= 6}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50 ${border}`}
                  >
                    + Add option
                  </button>

                  <button
                    type="submit"
                    className={`rounded-xl px-5 py-3 text-sm font-semibold ${primaryButton}`}
                  >
                    Publish Poll
                  </button>
                </div>
              </form>
            )}

            {polls.length === 0 && (
              <div className={`rounded-2xl border border-dashed p-10 text-center ${border}`}>
                <div className="text-4xl">📊</div>

                <h3 className="mt-3 text-lg font-bold">
                  No polls yet
                </h3>

                <p className={`mt-2 text-sm ${muted}`}>
                  Create the first poll and invite readers to vote.
                </p>
              </div>
            )}

            {/* Poll list */}
            {polls.map((poll) => {
              const totalVotes = poll.options.reduce(
                (total, option) => total + option.votes.length,
                0,
              )

              const myVote = poll.options.find((option) =>
                option.votes.includes(profile.username),
              )

              return (
                <article
                  key={poll.id}
                  className={`rounded-2xl border p-5 sm:p-6 ${panel}`}
                >
                  <div className="flex items-start gap-3">

                    <Avatar
                      src={poll.avatar}
                      username={poll.username}
                    />

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            {poll.username}
                          </p>

                          <p className={`text-xs ${muted}`}>
                            {formatDate(poll.createdAt)}
                          </p>
                        </div>

                        {poll.username?.toLowerCase() === profile.username.toLowerCase() && (
                          <button
                            type="button"
                            onClick={() => deletePoll(poll.id)}
                            className={`text-sm ${muted} hover:text-red-500`}
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <h3 className="mt-4 text-lg font-bold">
                        {poll.question}
                      </h3>

                      <p className={`mt-1 text-xs ${muted}`}>
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                        {myVote ? ' · You voted' : ''}
                      </p>

                      <div className="mt-4 space-y-3">
                        {poll.options.map((option) => {
                          const votes = option.votes.length

                          const percentage = totalVotes
                            ? Math.round((votes / totalVotes) * 100)
                            : 0

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                votePoll(poll.id, option.id)
                              }
                              className={`relative w-full overflow-hidden rounded-xl border p-3 text-left transition ${border} hover:opacity-80`}
                            >
                              <span
                                className={`absolute inset-y-0 left-0 ${
                                  isLight
                                    ? 'bg-blue-100'
                                    : 'bg-[#49336F]'
                                }`}
                                style={{ width: `${percentage}%` }}
                              />

                              <span className="relative flex items-center justify-between gap-3">
                                <span className="break-words text-sm font-medium">
                                  {option.text}
                                </span>

                                <span className="shrink-0 text-xs font-semibold">
                                  {percentage}%
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      <p className={`mt-2 text-xs ${muted}`}>
                        Select an option to vote. Select again to remove your vote.
                      </p>

                      {/* Poll replies */}
                      <div className={`mt-5 border-t pt-4 ${border}`}>
                        <p className={`mb-3 text-sm font-semibold ${muted}`}>
                          Replies ({poll.replies?.length || 0})
                        </p>

                        <div className="space-y-3">
                          {(poll.replies || []).map((reply) => (
                            <div
                              key={reply.id}
                              className={`rounded-xl px-3 py-2 ${softBackground}`}
                            >
                              <p className="text-sm font-semibold">
                                {reply.username}
                              </p>

                              <p className="mt-1 break-words text-sm">
                                {reply.text}
                              </p>

                              <p className={`mt-1 text-xs ${muted}`}>
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>

                        <form
                          onSubmit={(event) =>
                            addPollReply(event, poll.id)
                          }
                          className="mt-4 flex gap-2"
                        >
                          <input
                            value={replyInputs[poll.id] || ''}
                            onChange={(event) =>
                              setReplyInputs((current) => ({
                                ...current,
                                [poll.id]: event.target.value,
                              }))
                            }
                            placeholder="Reply to this poll..."
                            maxLength={500}
                            className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${input}`}
                          />

                          <button
                            type="submit"
                            disabled={!(replyInputs[poll.id] || '').trim()}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50 ${primaryButton}`}
                          >
                            Reply
                          </button>
                        </form>

                      </div>

                    </div>
                  </div>
                </article>
              )
            })}

          </section>
        )}

        {/* YOUR STORIES */}
        <section className={`mt-10 rounded-2xl border p-5 sm:p-6 ${panel}`}>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                Your Stories
              </h2>

              <p className={`mt-2 text-sm ${muted}`}>
                Manage the stories you have written.
              </p>
            </div>

            <Link
              to="/writer"
              className={`rounded-xl px-5 py-3 text-sm font-semibold ${primaryButton}`}
            >
              + Write a Story
            </Link>
          </div>

          {loadingStories ? (
            <p className={`mt-6 text-center ${muted}`}>
              Loading your stories...
            </p>
          ) : myStories.length === 0 ? (
            <div className={`mt-6 rounded-xl border border-dashed p-8 text-center ${border}`}>
              <div className="text-4xl">📚</div>

              <h3 className="mt-3 font-bold">
                You haven't written any stories yet.
              </h3>

              <p className={`mt-2 text-sm ${muted}`}>
                Start writing and share your stories with readers.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              {myStories.map((story) => (
                <article
                  key={story.id}
                  className={`overflow-hidden rounded-xl border ${border}`}
                >

                  {story.cover_image || story.coverImage ? (
                    <img
                      src={story.cover_image || story.coverImage}
                      alt={story.title}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-linear-to-br from-indigo-950 to-purple-800 text-4xl text-white">
                      ✦
                    </div>
                  )}

                  <div className="p-4">

                    <h3 className="font-bold">
                      {story.title}
                    </h3>

                    <p className={`mt-1 text-sm ${muted}`}>
                      {story.genre || 'Uncategorized'}
                      {' · '}
                      {story.status || 'Draft'}
                    </p>

                    <p className={`mt-2 line-clamp-2 text-sm ${muted}`}>
                      {story.description || 'No description available.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">

                      {story.status === 'published' && (
                        <Link
                          to={`/reader/${story.id}`}
                          className={`rounded-lg px-3 py-2 text-sm ${primaryButton}`}
                        >
                          Read
                        </Link>
                      )}

                      <Link
                        to="/writer"
                        className={`rounded-lg border px-3 py-2 text-sm ${border}`}
                      >
                        Manage
                      </Link>

                      <button
                        type="button"
                        onClick={() => removeMyStory(story.id)}
                        className="rounded-lg border border-red-400 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10"
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                </article>
              ))}

            </div>
          )}

        </section>

      </div>

      {/* ABOUT EDIT POPUP */}
      {aboutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAboutModal(false)
            }
          }}
        >
          <div className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border p-6 shadow-2xl ${panel}`}>

            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-widest ${accent}`}>
                  Personal information
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Edit About Me
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setAboutModal(false)}
                className={`rounded-lg px-3 py-2 text-xl ${muted}`}
                aria-label="Close popup"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={saveProfile}
              className="mt-6 space-y-5"
            >

              <div>
                <label
                  htmlFor="aboutBio"
                  className="mb-2 block text-sm font-semibold"
                >
                  About me
                </label>

                <textarea
                  id="aboutBio"
                  name="bio"
                  rows={4}
                  maxLength={1000}
                  value={profile.bio}
                  onChange={handleProfileChange}
                  placeholder="Tell readers about yourself..."
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${input}`}
                />
              </div>

              <div>
                <label
                  htmlFor="aboutGenre"
                  className="mb-2 block text-sm font-semibold"
                >
                  Favourite genre
                </label>

                <select
                  id="aboutGenre"
                  name="favoriteGenre"
                  value={profile.favoriteGenre}
                  onChange={handleProfileChange}
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${input}`}
                >
                  {[
                    'Fantasy',
                    'Romance',
                    'Mystery',
                    'Thriller',
                    'Science Fiction',
                    'Horror',
                    'Adventure',
                    'Drama',
                    'Other',
                  ].map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => {
                    setAboutModal(false)
                    loadProfile()
                  }}
                  className={`rounded-xl border px-5 py-3 text-sm font-semibold ${border}`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50 ${primaryButton}`}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </main>
  )
}