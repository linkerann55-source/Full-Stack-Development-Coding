
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { getCurrentUser } from '../utils/auth.js'
import { getFollowers, getFollowing } from '../utils/social.js'
import {
  getProfile,
  updateProfile,
  uploadProfilePhotos,
} from '../api/profile.js'
import { getMyStories, deleteStory } from '../api/stories.js'
import {
  getConversations,
  createConversation,
  updateConversation,
  deleteConversation as deleteConversationAPI,
  addConversationReply,
  getPolls,
  createPoll as createPollAPI,
  votePoll as votePollAPI,
  addPollReply as addPollReplyAPI,
  deletePoll as deletePollAPI,
} from '../api/community.js'

function getProfileKey(userId) {
  return userId
    ? `moonlit_pages_profile_${userId}`
    : 'moonlit_pages_profile'
}

const defaultProfile = {
  username: 'Moonlight Reader',
  bio: 'Lost in stories, found among the stars. ✨',
  favoriteGenre: 'Fantasy',
  avatar: '',
  coverPhoto: '',
}

const genreOptions = [
  'Fantasy',
  'Romance',
  'Mystery',
  'Thriller',
  'Science Fiction',
  'Horror',
  'Adventure',
  'Drama',
  'Other',
]

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

function initials(name) {
  return (name || 'Reader')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

async function compressAvatar(file) {
  const image = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const maxSize = 300

  const scale = Math.min(
    maxSize / image.width,
    maxSize / image.height,
    1,
  )

  canvas.width = Math.round(image.width * scale)
  canvas.height = Math.round(image.height * scale)

  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/webp', 0.75)
  })

  image.close()

  if (!blob) return file

  return new File([blob], 'avatar.webp', {
    type: 'image/webp',
  })
}

function Avatar({ src, username, size = 'h-12 w-12' }) {
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 font-bold text-white`}
    >
      {src ? (
        <img
          src={fixImageUrl(src)}
          alt={`${username || 'User'}'s profile`}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        initials(username)
      )}
    </div>
  )
}

function getStoryList(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.stories)) return result.stories
  if (Array.isArray(result?.data)) return result.data
  return []
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

function wasEdited(post) {
  if (!post.updatedAt || !post.createdAt) return false

  return (
    new Date(post.updatedAt).getTime() -
    new Date(post.createdAt).getTime()
  ) > 1000
}

export default function Profile() {
  const { theme } = useOutletContext() || {}
  const isDark = theme === 'dark'
  const isLight = !isDark

  const [user, setUser] = useState(() => getCurrentUser() || {})

  const [profile, setProfile] = useState(() => {
    const currentUser = getCurrentUser()
    const profileKey = getProfileKey(currentUser?.id)

    return {
      ...defaultProfile,
      ...(readJSON(profileKey, {}) || {}),
      username:
        currentUser?.username ||
        currentUser?.name ||
        defaultProfile.username,
    }
  })

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
  const [savingProfile, setSavingProfile] = useState(false)
  const [message, setMessage] = useState('')

  const [posts, setPosts] = useState([])
  const [polls, setPolls] = useState([])
  const [loadingCommunity, setLoadingCommunity] = useState(true)

  const [postText, setPostText] = useState('')
  const [editingPostId, setEditingPostId] = useState(null)
  const [editPostText, setEditPostText] = useState('')

  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])

  const [replyInputs, setReplyInputs] = useState({})
  const [showPollForm, setShowPollForm] = useState(false)

  const colors = {
    page: isDark ? 'text-[#F5EFFB]' : 'text-[#49372E]',
    muted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    accent: isDark ? 'text-[#D6B779]' : 'text-[#A66B50]',
    border: isDark ? 'border-[#3A2D50]' : 'border-[#E7D9C9]',
    panel: isDark
      ? 'border-[#3A2D50] bg-[#25183D]/90'
      : 'border-[#E7D9C9] bg-[#FFF9F1]/90',
    input: isDark
      ? 'border-[#49385F] bg-[#170F27] text-[#F5EFFB] placeholder:text-[#88799B] focus:border-[#A78BFA]'
      : 'border-[#D8BFA3] bg-white text-[#49372E] placeholder:text-[#A99A8D] focus:border-[#A66B50]',
    primaryButton: isDark
      ? 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'
      : 'bg-[#A66B50] text-white hover:bg-[#89543F]',
    secondaryButton: isDark
      ? 'border-[#594477] text-[#D6B779] hover:bg-[#25183D]'
      : 'border-[#D8BFA3] text-[#A66B50] hover:bg-[#F0E3D4]',
    softBackground: isDark ? 'bg-black/20' : 'bg-[#F5EBDD]/70',
    coverBackground: isDark
      ? 'bg-gradient-to-r from-[#10091F] via-[#25183D] to-[#39204D]'
      : 'bg-gradient-to-r from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',
    sectionBackground: isDark
      ? 'border-[#3A2D50] bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
      : 'border-[#E7D9C9] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',
  }


async function loadProfile() {
  const currentUser = getCurrentUser()
  const profileKey = getProfileKey(currentUser?.id)
  const saved = readJSON(profileKey, {})

  const cachedProfile = {
    ...defaultProfile,
    ...saved,
    username:
      saved?.username ||
      currentUser?.username ||
      currentUser?.name ||
      defaultProfile.username,
    avatar: fixImageUrl(saved?.avatar || ''),
    coverPhoto: fixImageUrl(saved?.coverPhoto || ''),
  }

  setUser(currentUser || {})
  setProfile(cachedProfile)

  try {
    const serverProfile = await getProfile()

    const registeredName =
      serverProfile?.username ||
      serverProfile?.name ||
      cachedProfile.username

    const updatedProfile = {
      ...cachedProfile,
      username: registeredName,
      bio: serverProfile?.bio ?? cachedProfile.bio,
      favoriteGenre:
        serverProfile?.favorite_genre ||
        cachedProfile.favoriteGenre,
      avatar: fixImageUrl(
        serverProfile?.avatar || cachedProfile.avatar,
      ),
      coverPhoto: fixImageUrl(
        serverProfile?.cover_photo || cachedProfile.coverPhoto,
      ),
    }

    setProfile(updatedProfile)
    saveJSON(profileKey, updatedProfile)

    // Get follower and following counts using the actual user ID
    const userId =
      currentUser?.id ||
      serverProfile?.id ||
      serverProfile?.user?.id

    if (userId) {
      const [followers, following] = await Promise.all([
        getFollowers(userId),
        getFollowing(userId),
      ])

      setFollowersCount(
        Array.isArray(followers) ? followers.length : 0,
      )

      setFollowingCount(
        Array.isArray(following) ? following.length : 0,
      )
    } else {
      console.error('User ID not found. Cannot load follow counts.')
    }
  } catch (error) {
    console.error('Profile loading error:', error)
  }
}

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

  // Load only the logged-in user's conversations and polls
  async function loadCommunity() {
    setLoadingCommunity(true)

    try {
      const serverProfile = await getProfile()

      const username =
        serverProfile?.username ||
        serverProfile?.name ||
        getCurrentUser()?.username ||
        getCurrentUser()?.name ||
        profile.username

      const [conversationData, pollData] = await Promise.all([
        getConversations(username),
        getPolls(username),
      ])

      setPosts(Array.isArray(conversationData) ? conversationData : [])
      setPolls(Array.isArray(pollData) ? pollData : [])
    } catch (error) {
      console.error('Community loading error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to load conversations and polls.',
      )
    } finally {
      setLoadingCommunity(false)
    }
  }

  useEffect(() => {
    loadProfile()
    loadMyStories()
    loadCommunity()

    const refresh = () => {
      loadProfile()
      loadMyStories()
      loadCommunity()
    }

    const refreshCommunity = () => {
      loadCommunity()
    }

    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refreshCommunity)
    window.addEventListener('moonlit-auth-updated', refresh)
    window.addEventListener('moonlit-profile-updated', refresh)
    window.addEventListener('moonlit-following-updated', refresh)

    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refreshCommunity)
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

  async function handlePhotoUpload(event, field) {
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

    try {
      const processedFile =
        field === 'avatar'
          ? await compressAvatar(file)
          : file

      const preview = URL.createObjectURL(processedFile)

      setPhotoFiles((current) => ({
        ...current,
        [field]: processedFile,
      }))

      setProfile((current) => ({
        ...current,
        [field]: preview,
      }))

      setMessage('')
    } catch {
      setMessage('Unable to process this image. Please try another.')
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSavingProfile(true)
    setMessage('')

    try {
      const updated = await updateProfile({
        username: profile.username.trim(),
        bio: profile.bio.trim(),
        favoriteGenre: profile.favoriteGenre.trim(),
      })

      let uploadedPhotos = {}

      if (photoFiles.avatar || photoFiles.coverPhoto) {
        uploadedPhotos = await uploadProfilePhotos(photoFiles)
      }

      const nextProfile = {
        ...profile,
        username: updated?.username || profile.username,
        bio: updated?.bio ?? profile.bio,
        favoriteGenre:
          updated?.favorite_genre || profile.favoriteGenre,
        avatar: fixImageUrl(
          uploadedPhotos?.avatar ?? profile.avatar,
        ),
        coverPhoto: fixImageUrl(
          uploadedPhotos?.cover_photo ?? profile.coverPhoto,
        ),
      }

      setProfile(nextProfile)
      setPhotoFiles({ avatar: null, coverPhoto: null })
      saveJSON(PROFILE_KEY, nextProfile)

      setUser((current) => ({
        ...current,
        username: updated?.username || current?.username,
      }))

      setEditing(false)
      setMessage('Profile updated successfully!')

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

  function cancelProfileEdit() {
    setPhotoFiles({ avatar: null, coverPhoto: null })
    setEditing(false)
    loadProfile()
  }

  async function removeMyStory(storyId) {
    if (!window.confirm('Are you sure you want to delete this story?')) {
      return
    }

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

  async function createPost(event) {
    event.preventDefault()

    const text = postText.trim()
    if (!text) return

    try {
      setMessage('')

      const newPost = await createConversation(text)

      if (!newPost) {
        throw new Error('The server did not return the new conversation.')
      }

      setPosts((current) => [newPost, ...current])
      setPostText('')
    } catch (error) {
      console.error('Create conversation error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to publish your conversation. Please log in and try again.',
      )
    }
  }

  function startEditPost(post) {
    setEditingPostId(post.id)
    setEditPostText(post.text)
  }

  async function saveEditedPost(event, postId) {
    event.preventDefault()

    const text = editPostText.trim()
    if (!text) return

    try {
      const updatedPost = await updateConversation(postId, text)

      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? updatedPost : post,
        ),
      )

      setEditingPostId(null)
      setEditPostText('')
      setMessage('')
    } catch (error) {
      console.error('Update conversation error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to update this conversation.',
      )
    }
  }

  async function deletePost(postId) {
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return
    }

    try {
      await deleteConversationAPI(postId)

      setPosts((current) =>
        current.filter((post) => post.id !== postId),
      )

      setMessage('')
    } catch (error) {
      console.error('Delete conversation error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to delete this conversation.',
      )
    }
  }

  async function addReply(event, postId) {
    event.preventDefault()

    const text = (replyInputs[postId] || '').trim()
    if (!text) return

    try {
      const updatedPost = await addConversationReply(postId, text)

      setPosts((current) =>
        current.map((post) =>
          post.id === postId ? updatedPost : post,
        ),
      )

      setReplyInputs((current) => ({
        ...current,
        [postId]: '',
      }))

      setMessage('')
    } catch (error) {
      console.error('Conversation reply error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to add your reply.',
      )
    }
  }

  async function createPoll(event) {
    event.preventDefault()

    const question = pollQuestion.trim()
    const options = pollOptions
      .map((item) => item.trim())
      .filter(Boolean)

    if (!question || options.length < 2) {
      setMessage('Enter a question and at least two options.')
      return
    }

    try {
      const newPoll = await createPollAPI(question, options)

      if (!newPoll) {
        throw new Error('The server did not return the new poll.')
      }

      setPolls((current) => [newPoll, ...current])
      setPollQuestion('')
      setPollOptions(['', ''])
      setShowPollForm(false)
      setMessage('')
      setTab('polls')
    } catch (error) {
      console.error('Create poll error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to publish this poll. Please log in and try again.',
      )
    }
  }

  async function votePoll(pollId, optionId) {
    try {
      const updatedPoll = await votePollAPI(pollId, optionId)

      setPolls((current) =>
        current.map((poll) =>
          poll.id === pollId ? updatedPoll : poll,
        ),
      )

      setMessage('')
    } catch (error) {
      console.error('Poll vote error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to submit your vote.',
      )
    }
  }

  async function addPollReply(event, pollId) {
    event.preventDefault()

    const text = (replyInputs[pollId] || '').trim()
    if (!text) return

    try {
      const updatedPoll = await addPollReplyAPI(pollId, text)

      setPolls((current) =>
        current.map((poll) =>
          poll.id === pollId ? updatedPoll : poll,
        ),
      )

      setReplyInputs((current) => ({
        ...current,
        [pollId]: '',
      }))

      setMessage('')
    } catch (error) {
      console.error('Poll reply error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to add your poll reply.',
      )
    }
  }

  async function deletePoll(pollId) {
    if (!window.confirm('Are you sure you want to delete this poll?')) {
      return
    }

    try {
      await deletePollAPI(pollId)

      setPolls((current) =>
        current.filter((poll) => poll.id !== pollId),
      )

      setMessage('')
    } catch (error) {
      console.error('Delete poll error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to delete this poll.',
      )
    }
  }

  function updatePollOption(index, value) {
    setPollOptions((current) =>
      current.map((option, i) =>
        i === index ? value : option,
      ),
    )
  }

  function addPollOption() {
    if (pollOptions.length < 6) {
      setPollOptions((current) => [...current, ''])
    }
  }

  function removePollOption(index) {
    if (pollOptions.length > 2) {
      setPollOptions((current) =>
        current.filter((_, i) => i !== index),
      )
    }
  }

  const tabs = [
    { id: 'stories', label: 'Your Stories' },
    { id: 'conversations', label: 'Conversation' },
    { id: 'polls', label: 'Poll' },
  ]

  const buttonClass = `rounded-xl px-5 py-3 text-sm font-semibold transition ${colors.primaryButton}`

  const outlineButtonClass = `rounded-xl border px-5 py-3 text-sm font-semibold transition ${colors.border} hover:opacity-80`

  return (
    <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${colors.page}`}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${colors.accent}`}>
            Your personal space
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            My Profile
          </h1>
        </div>

        {message && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${colors.panel}`}>
            {message}
          </div>
        )}

        <section className={`overflow-hidden rounded-3xl border ${colors.panel}`}>
          <div
            className={`h-36 bg-cover bg-center sm:h-48 ${colors.coverBackground}`}
            style={
              profile.coverPhoto
                ? { backgroundImage: `url("${profile.coverPhoto}")` }
                : undefined
            }
          />

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className={`rounded-full border-4 ${isDark ? 'border-[#25183D]' : 'border-[#FFF9F1]'}`}>
                  <Avatar
                    src={profile.avatar}
                    username={profile.username}
                    size="h-24 w-24 sm:h-32 sm:w-32"
                  />
                </div>

                <div className="min-w-0 pb-1">
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    {profile.username}
                  </h2>
                  <p className={`mt-1 break-all text-sm ${colors.muted}`}>
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
                className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${colors.secondaryButton}`}
              >
                {editing ? 'Close Editor' : '✎ Edit Profile'}
              </button>
            </div>

            {!editing && (
              <>
                <p className={`mt-5 max-w-2xl whitespace-pre-wrap leading-7 ${colors.muted}`}>
                  {profile.bio || 'This reader has not added a bio yet.'}
                </p>

                <p className={`mt-3 text-sm ${colors.accent}`}>
                  ✦ Favourite genre: {profile.favoriteGenre || 'Not set'}
                </p>
              </>
            )}

            <div className="mt-6 flex flex-wrap gap-6">
              <Link to="/followers" className="hover:opacity-75">
                <span className="font-bold">{followersCount}</span>{' '}
                <span className={colors.muted}>Followers</span>
              </Link>

              <Link to="/following" className="hover:opacity-75">
                <span className="font-bold">{followingCount}</span>{' '}
                <span className={colors.muted}>Following</span>
              </Link>

              <Link to="/library" className="hover:opacity-75">
                <span className="font-bold">♡</span>{' '}
                <span className={colors.muted}>My Library</span>
              </Link>
            </div>

            {editing && (
              <form onSubmit={saveProfile} className="mt-7 space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-semibold" htmlFor="avatarUpload">
                    Profile Picture
                  </label>

                  <div className="flex flex-wrap items-center gap-4">
                    <Avatar
                      src={profile.avatar}
                      username={profile.username}
                      size="h-20 w-20"
                    />

                    <div>
                      <label
                        htmlFor="avatarUpload"
                        className={`inline-flex cursor-pointer items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${colors.primaryButton}`}
                      >
                        Change Profile Photo
                      </label>

                      <input
                        id="avatarUpload"
                        type="file"
                        accept="image/*"
                        onChange={(event) => handlePhotoUpload(event, 'avatar')}
                        className="sr-only"
                      />

                      <p className={`mt-2 text-xs ${colors.muted}`}>
                        Image size must be 2 MB or smaller.
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-5 ${colors.softBackground} ${colors.border}`}>
                  <label htmlFor="coverUpload" className="mb-3 block text-sm font-semibold">
                    Cover Photo
                  </label>

                  {profile.coverPhoto && (
                    <img
                      src={profile.coverPhoto}
                      alt="Cover preview"
                      className="mb-4 h-40 w-full rounded-xl object-cover"
                    />
                  )}

                  <label
                    htmlFor="coverUpload"
                    className={`inline-flex cursor-pointer items-center rounded-xl px-4 py-3 text-sm font-semibold transition ${colors.primaryButton}`}
                  >
                    Change Cover Photo
                  </label>

                  <input
                    id="coverUpload"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handlePhotoUpload(event, 'coverPhoto')}
                    className="sr-only"
                  />

                  <p className={`mt-2 text-xs ${colors.muted}`}>
                    Image size must be 2 MB or smaller.
                  </p>
                </div>

                <div>
                  <label htmlFor="profileUsername" className="mb-2 block text-sm font-semibold">
                    Username
                  </label>

                  <input
                    id="profileUsername"
                    name="username"
                    type="text"
                    maxLength={50}
                    required
                    value={profile.username}
                    onChange={handleProfileChange}
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${colors.input}`}
                  />
                </div>

                <div>
                  <label htmlFor="profileBio" className="mb-2 block text-sm font-semibold">
                    About Me
                  </label>

                  <textarea
                    id="profileBio"
                    name="bio"
                    rows={4}
                    maxLength={1000}
                    value={profile.bio}
                    onChange={handleProfileChange}
                    placeholder="Tell readers about yourself..."
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${colors.input}`}
                  />
                </div>

                <div>
                  <label htmlFor="profileGenre" className="mb-2 block text-sm font-semibold">
                    Favourite Genre
                  </label>

                  <select
                    id="profileGenre"
                    name="favoriteGenre"
                    value={profile.favoriteGenre}
                    onChange={handleProfileChange}
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${colors.input}`}
                  >
                    {genreOptions.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className={`${buttonClass} disabled:opacity-50`}
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile'}
                  </button>

                  <button
                    type="button"
                    onClick={cancelProfileEdit}
                    className={outlineButtonClass}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        <nav className={`mt-7 flex flex-wrap gap-2 border-b pb-3 ${colors.border}`}>
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                tab === item.id
                  ? `${colors.primaryButton} shadow-md`
                  : isDark
                    ? 'bg-[#25183D] text-purple-100 hover:bg-purple-700 hover:text-white'
                    : 'bg-[#FFF9F1] text-[#49372E] hover:bg-[#F0E3D4] hover:text-[#89543F]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'stories' && (
          <section className={`mt-6 rounded-2xl border p-5 sm:p-6 ${colors.sectionBackground}`}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">Your Stories</h2>
                <p className={`mt-1 text-sm ${colors.muted}`}>
                  Manage the stories you have written.
                </p>
              </div>

              <Link to="/writer" className={buttonClass}>
                + Write a Story
              </Link>
            </div>

            {loadingStories ? (
              <p className={`py-8 text-center ${colors.muted}`}>
                Loading your stories...
              </p>
            ) : myStories.length === 0 ? (
              <div className={`rounded-xl border border-dashed p-8 text-center ${colors.border}`}>
                <div className="text-4xl">📚</div>
                <h3 className="mt-3 font-bold">
                  You haven't written any stories yet.
                </h3>
                <p className={`mt-2 text-sm ${colors.muted}`}>
                  Start writing and share your stories with readers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myStories.map((story) => (
                  <article
                    key={story.id}
                    className={`relative overflow-visible rounded-xl border ${colors.border}`}
                  >
                    <div className="relative">
                      {story.cover_image || story.coverImage ? (
                        <img
                          src={story.cover_image || story.coverImage}
                          alt={`${story.title} cover`}
                          className="h-36 w-full rounded-t-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-36 items-center justify-center rounded-t-xl bg-gradient-to-br from-indigo-950 to-purple-800 text-4xl text-white">
                          ✦
                        </div>
                      )}

                      <details className="absolute right-3 top-3">
                        <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-black/70 text-xl text-white hover:bg-black">
                          ⋮
                        </summary>

                        <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#211533] py-1 text-sm text-white shadow-xl">
                          {String(story.status).toLowerCase() === 'published' && (
                            <Link
                              to={`/reader/${story.id}`}
                              className="block px-4 py-2.5 hover:bg-purple-500/20"
                            >
                              Read
                            </Link>
                          )}

                          <Link
                            to={`/writer?story=${encodeURIComponent(story.id)}`}
                            className="block px-4 py-2.5 hover:bg-purple-500/20"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => removeMyStory(story.id)}
                            className="block w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </details>
                    </div>

                    <div className="p-4">
                      <h3 className="truncate font-bold">{story.title}</h3>

                      <p className={`mt-1 text-xs ${colors.muted}`}>
                        {story.genre || 'Uncategorized'} · {story.status || 'Draft'}
                      </p>

                      <p className={`mt-2 line-clamp-2 text-sm ${colors.muted}`}>
                        {story.description || 'No description available.'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'conversations' && (
          <section className="mt-6 space-y-5">
            <form
              onSubmit={createPost}
              className={`rounded-2xl border p-5 sm:p-6 ${colors.panel}`}
            >
              <div className="flex gap-3">
                <Avatar
                  src={profile.avatar}
                  username={profile.username}
                />

                <div className="min-w-0 flex-1">
                  <label htmlFor="postText" className="mb-2 block font-semibold">
                    Start a conversation
                  </label>

                  <textarea
                    id="postText"
                    rows={3}
                    maxLength={2000}
                    value={postText}
                    onChange={(event) => setPostText(event.target.value)}
                    placeholder="What's on your mind, reader?"
                    className={`w-full resize-y rounded-xl border px-4 py-3 outline-none ${colors.input}`}
                  />

                  <div className="mt-3 flex justify-end">
                    <button
                      type="submit"
                      disabled={!postText.trim()}
                      className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      Publish Post
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {loadingCommunity ? (
              <div className={`rounded-2xl border p-10 text-center ${colors.panel}`}>
                <p className={colors.muted}>Loading conversations...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className={`rounded-2xl border border-dashed p-10 text-center ${colors.border}`}>
                <div className="text-4xl">💬</div>
                <h3 className="mt-3 text-lg font-bold">
                  Start your first conversation
                </h3>
                <p className={`mt-2 text-sm ${colors.muted}`}>
                  Share your thoughts about books, writing, or everyday life.
                </p>
              </div>
            ) : null}

            {!loadingCommunity && posts.map((post) => (
              <article
                key={post.id}
                className={`rounded-2xl border p-5 sm:p-6 ${colors.panel}`}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    src={post.avatar}
                    username={post.username}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{post.username}</p>

                        <p className={`text-xs ${colors.muted}`}>
                          {formatDate(post.createdAt)}
                          {wasEdited(post) ? ' · Edited' : ''}
                        </p>
                      </div>

                      {post.username?.toLowerCase() === profile.username.toLowerCase() && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditPost(post)}
                            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${colors.border}`}
                          >
                            ✎ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deletePost(post.id)}
                            className="rounded-lg border border-red-400 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {editingPostId === post.id ? (
                      <form
                        onSubmit={(event) => saveEditedPost(event, post.id)}
                        className="mt-4 space-y-3"
                      >
                        <textarea
                          value={editPostText}
                          onChange={(event) => setEditPostText(event.target.value)}
                          maxLength={2000}
                          rows={4}
                          className={`w-full rounded-xl border px-4 py-3 outline-none ${colors.input}`}
                        />

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={!editPostText.trim()}
                            className={`${buttonClass} disabled:opacity-50`}
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingPostId(null)
                              setEditPostText('')
                            }}
                            className={outlineButtonClass}
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

                    <div className={`mt-5 border-t pt-4 ${colors.border}`}>
                      <p className={`mb-3 text-sm font-semibold ${colors.muted}`}>
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

                            <div className={`min-w-0 flex-1 rounded-xl px-3 py-2 ${colors.softBackground}`}>
                              <p className="text-sm font-semibold">
                                {reply.username}
                              </p>

                              <p className="mt-1 break-words text-sm">
                                {reply.text}
                              </p>

                              <p className={`mt-1 text-xs ${colors.muted}`}>
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form
                        onSubmit={(event) => addReply(event, post.id)}
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
                          className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${colors.input}`}
                        />

                        <button
                          type="submit"
                          disabled={!(replyInputs[post.id] || '').trim()}
                          className={`${buttonClass} disabled:opacity-50`}
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

        {tab === 'polls' && (
          <section className="mt-6 space-y-5">
            <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-5 ${colors.panel}`}>
              <div>
                <h2 className="text-xl font-bold">Community Polls</h2>

                <p className={`mt-1 text-sm ${colors.muted}`}>
                  Ask readers a question and see what they choose.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPollForm((current) => !current)}
                className={buttonClass}
              >
                {showPollForm ? 'Cancel' : '+ Create Poll'}
              </button>
            </div>

            {showPollForm && (
              <form
                onSubmit={createPoll}
                className={`space-y-4 rounded-2xl border p-5 ${colors.panel}`}
              >
                <div>
                  <label htmlFor="pollQuestion" className="mb-2 block text-sm font-semibold">
                    Poll question
                  </label>

                  <input
                    id="pollQuestion"
                    value={pollQuestion}
                    onChange={(event) => setPollQuestion(event.target.value)}
                    maxLength={250}
                    placeholder="Which genre do you enjoy most?"
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${colors.input}`}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold">Options</p>

                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={option}
                        onChange={(event) =>
                          updatePollOption(index, event.target.value)
                        }
                        maxLength={100}
                        placeholder={`Option ${index + 1}`}
                        className={`min-w-0 flex-1 rounded-xl border px-4 py-3 outline-none ${colors.input}`}
                      />

                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePollOption(index)}
                          className={`px-3 ${colors.muted}`}
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
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50 ${colors.border}`}
                  >
                    + Add option
                  </button>

                  <button type="submit" className={buttonClass}>
                    Publish Poll
                  </button>
                </div>
              </form>
            )}

            {loadingCommunity ? (
              <div className={`rounded-2xl border p-10 text-center ${colors.panel}`}>
                <p className={colors.muted}>Loading polls...</p>
              </div>
            ) : polls.length === 0 ? (
              <div className={`rounded-2xl border border-dashed p-10 text-center ${colors.border}`}>
                <div className="text-4xl">📊</div>

                <h3 className="mt-3 text-lg font-bold">No polls yet</h3>

                <p className={`mt-2 text-sm ${colors.muted}`}>
                  Create the first poll and invite readers to vote.
                </p>
              </div>
            ) : null}

            {!loadingCommunity && polls.map((poll) => {
              const options = poll.options || []

              const totalVotes = options.reduce(
                (total, option) =>
                  total + (option.votes || []).length,
                0,
              )

              const myVote = options.find((option) =>
                (option.votes || []).includes(profile.username),
              )

              return (
                <article
                  key={poll.id}
                  className={`rounded-2xl border p-5 sm:p-6 ${colors.panel}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={poll.avatar}
                      username={poll.username}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{poll.username}</p>

                          <p className={`text-xs ${colors.muted}`}>
                            {formatDate(poll.createdAt)}
                          </p>
                        </div>

                        {poll.username?.toLowerCase() === profile.username.toLowerCase() && (
                          <button
                            type="button"
                            onClick={() => deletePoll(poll.id)}
                            className="text-sm text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      <h3 className="mt-4 text-lg font-bold">
                        {poll.question}
                      </h3>

                      <p className={`mt-1 text-xs ${colors.muted}`}>
                        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                        {myVote ? ' · You voted' : ''}
                      </p>

                      <div className="mt-4 space-y-3">
                        {options.map((option) => {
                          const votes = (option.votes || []).length

                          const percentage = totalVotes
                            ? Math.round((votes / totalVotes) * 100)
                            : 0

                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => votePoll(poll.id, option.id)}
                              className={`relative w-full overflow-hidden rounded-xl border p-3 text-left transition ${colors.border} hover:opacity-80`}
                            >
                              <span
                                className={`absolute inset-y-0 left-0 ${isDark ? 'bg-[#49336F]' : 'bg-[#EAD9C7]'}`}
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

                      <p className={`mt-2 text-xs ${colors.muted}`}>
                        Select an option to vote. Select again to remove your vote.
                      </p>

                      <div className={`mt-5 border-t pt-4 ${colors.border}`}>
                        <p className={`mb-3 text-sm font-semibold ${colors.muted}`}>
                          Replies ({poll.replies?.length || 0})
                        </p>

                        <div className="space-y-3">
                          {(poll.replies || []).map((reply) => (
                            <div
                              key={reply.id}
                              className={`rounded-xl px-3 py-2 ${colors.softBackground}`}
                            >
                              <p className="text-sm font-semibold">
                                {reply.username}
                              </p>

                              <p className="mt-1 break-words text-sm">
                                {reply.text}
                              </p>

                              <p className={`mt-1 text-xs ${colors.muted}`}>
                                {formatDate(reply.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>

                        <form
                          onSubmit={(event) => addPollReply(event, poll.id)}
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
                            className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${colors.input}`}
                          />

                          <button
                            type="submit"
                            disabled={!(replyInputs[poll.id] || '').trim()}
                            className={`${buttonClass} disabled:opacity-50`}
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
      </div>
    </main>
  )
}
