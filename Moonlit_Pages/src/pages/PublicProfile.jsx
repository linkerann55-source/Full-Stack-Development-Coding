
import { useEffect, useState } from 'react'
import { Link, useParams, useOutletContext } from 'react-router-dom'
import api from '../api/axios.js'
import { getStories } from '../api/stories.js'
import {
  getConversations,
  addConversationReply as addConversationReplyAPI,
  getPolls,
  votePoll as votePollAPI,
  addPollReply as addPollReplyAPI,
} from '../api/community.js'
import {
  followUser,
  unfollowUser,
  checkFollow,
} from '../utils/social.js'

function fixImageUrl(url) {
  if (!url) return ''

  const cleanUrl = String(url).trim()

  if (cleanUrl.startsWith('data:image/')) return cleanUrl

  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://')
  ) {
    return cleanUrl.replace(
      'http://localhost/storage/',
      'http://127.0.0.1:8000/storage/',
    )
  }

  if (cleanUrl.startsWith('/storage/')) {
    return `http://127.0.0.1:8000${cleanUrl}`
  }

  return `http://127.0.0.1:8000/storage/${cleanUrl.replace(/^\/+/, '')}`
}

function initials(name) {
  return (name || 'Reader')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

function Avatar({ src, username, size = 'h-12 w-12' }) {
  return (
    <div className={`${size} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 font-bold text-white`}>
      {src ? (
        <img
          src={fixImageUrl(src)}
          alt={`${username || 'User'}'s profile`}
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

  if (!Number.isFinite(elapsed) || elapsed < 60000) return 'Just now'
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)}m ago`
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)}h ago`

  return new Date(date).toLocaleDateString()
}

export default function PublicProfile() {
  const { username } = useParams()
  const { theme } = useOutletContext() || {}

  const isDark = theme === 'dark'

  const [author, setAuthor] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [stories, setStories] = useState([])
  const [posts, setPosts] = useState([])
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState('stories')

  const [replyInputs, setReplyInputs] = useState({})
  const [actionLoading, setActionLoading] = useState({})

  // Block and report states
  const [blockedByMe, setBlockedByMe] = useState(false)
  const [blockedMe, setBlockedMe] = useState(false)
  const [safetyLoading, setSafetyLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')

  const isOwnProfile =
    currentUser?.id &&
    author?.id &&
    Number(currentUser.id) === Number(author.id)

  const isBlocked = blockedByMe || blockedMe

  const colors = {
    page: isDark ? 'text-[#F5EFFB]' : 'text-[#49372E]',
    muted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    accent: isDark ? 'text-[#D6B779]' : 'text-[#A66B50]',
    border: isDark ? 'border-[#3A2D50]' : 'border-[#E7D9C9]',
    panel: isDark
      ? 'border-[#3A2D50] bg-[#25183D]/90'
      : 'border-[#E7D9C9] bg-[#FFF9F1]/90',
    input: isDark
      ? 'border-[#49385F] bg-[#170F27] text-[#F5EFFB]'
      : 'border-[#D8BFA3] bg-white text-[#49372E]',
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

  const authorUsername = author?.username || author?.name || ''
  const authorName = author?.username || author?.name || 'Moonlit Reader'

  async function refreshCommunity() {
    if (!authorUsername || isBlocked) return

    const [conversationData, pollData] = await Promise.all([
      getConversations(authorUsername),
      getPolls(authorUsername),
    ])

    setPosts(Array.isArray(conversationData) ? conversationData : [])
    setPolls(Array.isArray(pollData) ? pollData : [])
  }

  async function loadProfile() {
    setLoading(true)
    setMessage('')

    // Reset previous profile state when changing users
    setBlockedByMe(false)
    setBlockedMe(false)
    setFollowing(false)
    setStories([])
    setPosts([])
    setPolls([])
    setMenuOpen(false)

    try {
      const decodedUsername = decodeURIComponent(username || '')

      const profileResponse = await api.get(
        `/users/username/${encodeURIComponent(decodedUsername)}`,
      )

      const profileData =
        profileResponse.data?.profile ||
        profileResponse.data?.user ||
        profileResponse.data

      if (!profileData?.id) {
        throw new Error('Profile not found.')
      }

      const formattedProfile = {
        ...profileData,
        avatar: fixImageUrl(profileData.avatar),
        cover_photo: fixImageUrl(
        profileData.cover_photo || profileData.coverPhoto
      ),
        followers_count: profileData.followers_count || 0,
        following_count: profileData.following_count || 0,
      }

      setAuthor(formattedProfile)

      // Get logged-in user
      let loggedInUser = null

      try {
        const userResponse = await api.get('/user')
        loggedInUser = userResponse.data?.user || userResponse.data
      } catch {
        loggedInUser = null
      }

      setCurrentUser(loggedInUser)

      // Check block status
      let userIsBlocked = false

      if (
        loggedInUser?.id &&
        Number(loggedInUser.id) !== Number(profileData.id)
      ) {
        try {
          const response = await api.get(
            `/users/${profileData.id}/block-status`,
          )

          const blockedByCurrentUser = Boolean(
            response.data?.blocked_by_me,
          )

          const blockedCurrentUser = Boolean(
            response.data?.blocked_me,
          )

          setBlockedByMe(blockedByCurrentUser)
          setBlockedMe(blockedCurrentUser)

          userIsBlocked =
            blockedByCurrentUser || blockedCurrentUser
        } catch (error) {
          console.error('Block status error:', error)
        }
      }

      // Check follow status
      if (
        loggedInUser?.id &&
        Number(loggedInUser.id) !== Number(profileData.id) &&
        !userIsBlocked
      ) {
        try {
          const followStatus = await checkFollow(profileData.id)

          setFollowing(
            Boolean(
              followStatus?.following ??
                followStatus?.is_following ??
                followStatus,
            ),
          )
        } catch {
          setFollowing(false)
        }
      } else {
        setFollowing(false)
      }

      // Do not load public content when either user has blocked the other
      if (userIsBlocked) {
        setStories([])
        setPosts([])
        setPolls([])
        return
      }

      // Load published stories
      try {
        const storyResult = await getStories()
        const allStories = getStoryList(storyResult)

        const authorStories = allStories.filter((story) => {
          const storyUserId =
            story.user_id ||
            story.user?.id ||
            story.author?.id

          const storyUsername =
            story.username ||
            story.user?.username ||
            story.author?.username ||
            story.author_name

          const belongsToAuthor =
            Number(storyUserId) === Number(profileData.id) ||
            (storyUsername &&
              storyUsername.toLowerCase() ===
                (profileData.username || profileData.name || '').toLowerCase())

          return (
            belongsToAuthor &&
            String(story.status || '').toLowerCase() === 'published'
          )
        })

        setStories(authorStories)
      } catch (error) {
        console.error('Loading public stories error:', error)
        setStories([])
      }

      // Load conversations and polls
      const profileUsername =
        profileData.username || profileData.name || ''

      try {
        const [conversationData, pollData] = await Promise.all([
          getConversations(profileUsername),
          getPolls(profileUsername),
        ])

        setPosts(Array.isArray(conversationData) ? conversationData : [])
        setPolls(Array.isArray(pollData) ? pollData : [])
      } catch (error) {
        console.error('Loading conversations and polls error:', error)
        setPosts([])
        setPolls([])
        setMessage(
          error.response?.data?.message ||
            'Unable to load conversations and polls.',
        )
      }
    } catch (error) {
      console.error('Public profile loading error:', error)

      setMessage(
        error.response?.data?.message ||
          error.message ||
          'Unable to load this profile.',
      )

      setAuthor(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [username])

  function requireLogin() {
    if (!currentUser) {
      setMessage('Please log in to reply or vote.')
      return false
    }

    return true
  }

  function setReplyValue(key, value) {
    setReplyInputs((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleConversationReply(event, postId) {
    event.preventDefault()

    if (!requireLogin() || isBlocked) return

    const key = `conversation-${postId}`
    const text = (replyInputs[key] || '').trim()

    if (!text) return

    setActionLoading((current) => ({ ...current, [key]: true }))
    setMessage('')

    try {
      await addConversationReplyAPI(postId, text)
      setReplyValue(key, '')
      await refreshCommunity()
    } catch (error) {
      console.error('Conversation reply error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to add your reply. Please try again.',
      )
    } finally {
      setActionLoading((current) => ({ ...current, [key]: false }))
    }
  }

  async function handlePollVote(pollId, optionId) {
    if (!requireLogin() || isBlocked) return

    const key = `vote-${pollId}`

    if (actionLoading[key]) return

    setActionLoading((current) => ({ ...current, [key]: true }))
    setMessage('')

    try {
      await votePollAPI(pollId, optionId)
      await refreshCommunity()
    } catch (error) {
      console.error('Poll voting error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to submit your vote. Please try again.',
      )
    } finally {
      setActionLoading((current) => ({ ...current, [key]: false }))
    }
  }

  async function handlePollReply(event, pollId) {
    event.preventDefault()

    if (!requireLogin() || isBlocked) return

    const key = `poll-reply-${pollId}`
    const text = (replyInputs[key] || '').trim()

    if (!text) return

    setActionLoading((current) => ({ ...current, [key]: true }))
    setMessage('')

    try {
      await addPollReplyAPI(pollId, text)
      setReplyValue(key, '')
      await refreshCommunity()
    } catch (error) {
      console.error('Poll reply error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to add your reply. Please try again.',
      )
    } finally {
      setActionLoading((current) => ({ ...current, [key]: false }))
    }
  }

  async function handleFollow() {
    if (!currentUser) {
      setMessage('Please log in to follow this author.')
      return
    }

    if (!author?.id || followLoading || isBlocked) return

    setFollowLoading(true)
    setMessage('')

    try {
      if (following) {
        await unfollowUser(author.id)
        setFollowing(false)

        setAuthor((current) => ({
          ...current,
          followers_count: Math.max(
            0,
            (current.followers_count || 0) - 1,
          ),
        }))
      } else {
        await followUser(author.id)
        setFollowing(true)

        setAuthor((current) => ({
          ...current,
          followers_count: (current.followers_count || 0) + 1,
        }))
      }

      window.dispatchEvent(new Event('moonlit-following-updated'))
    } catch (error) {
      console.error('Follow action error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to update follow status. Please try again.',
      )
    } finally {
      setFollowLoading(false)
    }
  }

  // Block or unblock user
  async function handleBlockToggle() {
    if (!author?.id || !currentUser || safetyLoading || blockedMe) return

    const action = blockedByMe ? 'unblock' : 'block'

    const confirmed = window.confirm(
      blockedByMe
        ? `Unblock ${authorName}?`
        : `Block ${authorName}? They will no longer be able to interact with you.`,
    )

    if (!confirmed) return

    setSafetyLoading(true)
    setMessage('')

    try {
      if (action === 'block') {
        await api.post(`/users/${author.id}/block`)

        setBlockedByMe(true)
        setFollowing(false)
        setStories([])
        setPosts([])
        setPolls([])

        setAuthor((current) => ({
          ...current,
          followers_count: Math.max(
            0,
            (current.followers_count || 0) - (following ? 1 : 0),
          ),
        }))

        setMessage(`You blocked ${authorName}.`)
      } else {
        await api.delete(`/users/${author.id}/block`)

        setBlockedByMe(false)
        setMessage(`You unblocked ${authorName}.`)

        // Reload profile content after unblocking
        await loadProfile()
      }

      setMenuOpen(false)
      window.dispatchEvent(new Event('moonlit-following-updated'))
    } catch (error) {
      console.error('Block action error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to update block status.',
      )
    } finally {
      setSafetyLoading(false)
    }
  }

  // Submit report
  async function handleReportSubmit(event) {
    event.preventDefault()

    if (!author?.id || !reportReason || safetyLoading) return

    setSafetyLoading(true)
    setMessage('')

    try {
      await api.post(`/users/${author.id}/report`, {
        reason: reportReason,
        details: reportDetails.trim() || null,
      })

      setShowReportModal(false)
      setReportReason('')
      setReportDetails('')
      setMenuOpen(false)

      setMessage(
        'Thank you. Your report has been submitted for review.',
      )
    } catch (error) {
      console.error('Report submission error:', error)

      setMessage(
        error.response?.data?.message ||
          'Unable to submit your report.',
      )
    } finally {
      setSafetyLoading(false)
    }
  }

  const tabs = [
    { id: 'stories', label: 'Stories' },
    { id: 'conversations', label: 'Conversation' },
    { id: 'polls', label: 'Polls' },
  ]

  const buttonClass = `rounded-xl px-5 py-3 text-sm font-semibold transition ${colors.primaryButton}`

  if (loading) {
    return (
      <main className={`min-h-screen px-4 py-12 ${colors.page}`}>
        <p className={`text-center ${colors.muted}`}>
          Loading profile...
        </p>
      </main>
    )
  }

  if (!author) {
    return (
      <main className={`min-h-screen px-4 py-12 ${colors.page}`}>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold">Profile not found</h1>

          <p className={`mt-3 ${colors.muted}`}>
            {message || 'This profile may not exist.'}
          </p>

          <Link
            to="/explore"
            className={`mt-6 inline-block ${buttonClass}`}
          >
            Explore Stories
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${colors.page}`}>
      <div className="mx-auto max-w-5xl">

        {/* Page heading */}
        <div className="mb-7">
          <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${colors.accent}`}>
            Moonlit Pages Community
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Reader Profile
          </h1>
        </div>

        {/* Feedback message */}
        {message && (
          <div className={`mb-5 rounded-xl border px-4 py-3 text-sm ${colors.panel}`}>
            {message}
          </div>
        )}

        {/* Profile header */}
        <section className={`overflow-hidden rounded-3xl border ${colors.panel}`}>
        <div
          className={`h-36 bg-cover bg-center bg-no-repeat sm:h-48 ${colors.coverBackground}`}
          style={
            author.cover_photo
              ? {
                  backgroundImage: `url("${fixImageUrl(author.cover_photo)}")`,
                }
              : undefined
          }
        />

          <div className="px-5 pb-6 sm:px-8">
            <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className={`rounded-full border-4 ${isDark ? 'border-[#25183D]' : 'border-[#FFF9F1]'}`}>
                  <Avatar
                    src={author.avatar}
                    username={authorName}
                    size="h-24 w-24 sm:h-32 sm:w-32"
                  />
                </div>

                <div className="min-w-0 pb-1">
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    {authorName}
                  </h2>

                  <p className={`mt-1 break-all text-sm ${colors.muted}`}>
                    @{author.username || author.name}
                  </p>
                </div>
              </div>

              {!isOwnProfile && currentUser && (
                <div className="relative flex items-center gap-2">
                  {!isBlocked && (
                    <button
                      type="button"
                      onClick={handleFollow}
                      disabled={followLoading || safetyLoading}
                      className={`rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                        following
                          ? `border ${colors.secondaryButton}`
                          : colors.primaryButton
                      }`}
                    >
                      {followLoading
                        ? 'Please wait...'
                        : following
                          ? 'Following'
                          : '+ Follow'}
                    </button>
                  )}

                  {isBlocked && (
                    <span className={`rounded-xl border px-4 py-3 text-sm ${colors.border} ${colors.muted}`}>
                      {blockedByMe
                        ? 'You blocked this user'
                        : 'This user blocked you'}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setMenuOpen((current) => !current)}
                    className={`rounded-xl border px-4 py-3 text-lg font-bold ${colors.secondaryButton}`}
                    aria-label="Profile options"
                    aria-expanded={menuOpen}
                  >
                    ⋮
                  </button>

                  {menuOpen && (
                    <div className={`absolute right-0 top-full z-30 mt-2 w-48 overflow-hidden rounded-xl border shadow-xl ${colors.panel}`}>
                      <button
                        type="button"
                        onClick={handleBlockToggle}
                        disabled={safetyLoading || blockedMe}
                        className="block w-full px-4 py-3 text-left text-sm transition hover:bg-black/10 disabled:opacity-50"
                      >
                        {safetyLoading
                          ? 'Please wait...'
                          : blockedByMe
                            ? 'Unblock User'
                            : 'Block User'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          setShowReportModal(true)
                        }}
                        disabled={safetyLoading}
                        className="block w-full px-4 py-3 text-left text-sm text-red-500 transition hover:bg-black/10 disabled:opacity-50"
                      >
                        Report User
                      </button>
                    </div>
                  )}
                </div>
              )}

              {isOwnProfile && (
                <Link
                  to="/profile"
                  className={`rounded-xl border px-5 py-3 text-sm font-semibold transition ${colors.secondaryButton}`}
                >
                  Edit My Profile
                </Link>
              )}
            </div>

            <p className={`mt-5 max-w-2xl whitespace-pre-wrap leading-7 ${colors.muted}`}>
              {author.bio || 'This reader has not added a bio yet.'}
            </p>

            <p className={`mt-3 text-sm ${colors.accent}`}>
              ✦ Favourite genre: {author.favorite_genre || 'Not set'}
            </p>

            <div className="mt-6 flex flex-wrap gap-6">
              <div>
                <span className="font-bold">{author.followers_count}</span>{' '}
                <span className={colors.muted}>Followers</span>
              </div>

              <div>
                <span className="font-bold">{author.following_count}</span>{' '}
                <span className={colors.muted}>Following</span>
              </div>
            </div>
          </div>
        </section>

        {/* Blocked profile notice */}
        {isBlocked ? (
          <section className={`mt-7 rounded-2xl border p-8 text-center ${colors.panel}`}>
            <div className="text-4xl">🔒</div>

            <h2 className="mt-3 text-xl font-bold">
              {blockedByMe
                ? 'You have blocked this user'
                : 'This user has blocked you'}
            </h2>

            <p className={`mt-2 text-sm ${colors.muted}`}>
              {blockedByMe
                ? 'You cannot view or interact with this user’s community content while they are blocked.'
                : 'You cannot view or interact with this user’s community content.'}
            </p>

            {blockedByMe && (
              <button
                type="button"
                onClick={handleBlockToggle}
                disabled={safetyLoading}
                className={`mt-5 rounded-xl px-5 py-3 text-sm font-semibold disabled:opacity-50 ${colors.primaryButton}`}
              >
                {safetyLoading ? 'Please wait...' : 'Unblock User'}
              </button>
            )}
          </section>
        ) : (
          <>
            {/* Profile tabs */}
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

            {/* Published stories */}
            {tab === 'stories' && (
              <section className={`mt-6 rounded-2xl border p-5 sm:p-6 ${colors.sectionBackground}`}>
                <div className="mb-5">
                  <h2 className="text-xl font-bold">
                    {authorName}'s Stories
                  </h2>

                  <p className={`mt-1 text-sm ${colors.muted}`}>
                    Published stories by this author.
                  </p>
                </div>

                {stories.length === 0 ? (
                  <div className={`rounded-xl border border-dashed p-8 text-center ${colors.border}`}>
                    <div className="text-4xl">📚</div>

                    <h3 className="mt-3 font-bold">
                      No published stories yet.
                    </h3>

                    <p className={`mt-2 text-sm ${colors.muted}`}>
                      This author has not published any stories.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {stories.map((story) => (
                      <article
                        key={story.id}
                        className={`overflow-hidden rounded-xl border ${colors.border}`}
                      >
                        {story.cover_image || story.coverImage ? (
                          <img
                            src={fixImageUrl(story.cover_image || story.coverImage)}
                            alt={`${story.title} cover`}
                            className="h-36 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-36 items-center justify-center bg-gradient-to-br from-indigo-950 to-purple-800 text-4xl text-white">
                            ✦
                          </div>
                        )}

                        <div className="p-4">
                          <h3 className="truncate font-bold">
                            {story.title}
                          </h3>

                          <p className={`mt-1 text-xs ${colors.muted}`}>
                            {story.genre || 'Uncategorized'}
                          </p>

                          <p className={`mt-2 line-clamp-2 text-sm ${colors.muted}`}>
                            {story.description || 'No description available.'}
                          </p>

                          <Link
                            to={`/reader/${story.id}`}
                            className={`mt-4 inline-block rounded-lg px-4 py-2 text-sm font-semibold ${colors.primaryButton}`}
                          >
                            Read Story
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Conversations */}
            {tab === 'conversations' && (
              <section className="mt-6 space-y-5">
                {posts.length === 0 && (
                  <div className={`rounded-2xl border border-dashed p-10 text-center ${colors.border}`}>
                    <div className="text-4xl">💬</div>

                    <h3 className="mt-3 text-lg font-bold">
                      No conversations yet
                    </h3>

                    <p className={`mt-2 text-sm ${colors.muted}`}>
                      This reader has not shared any conversations.
                    </p>
                  </div>
                )}

                {posts.map((post) => {
                  const replyKey = `conversation-${post.id}`

                  return (
                    <article
                      key={post.id}
                      className={`rounded-2xl border p-5 sm:p-6 ${colors.panel}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={post.avatar || author.avatar}
                          username={post.username || authorName}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {post.username || authorName}
                          </p>

                          <p className={`text-xs ${colors.muted}`}>
                            {formatDate(post.createdAt || post.created_at)}
                            {post.updatedAt &&
                            post.createdAt &&
                            new Date(post.updatedAt).getTime() -
                              new Date(post.createdAt).getTime() > 1000
                              ? ' · Edited'
                              : ''}
                          </p>

                          <p className="mt-4 whitespace-pre-wrap break-words leading-7">
                            {post.text}
                          </p>

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
                                      {formatDate(reply.createdAt || reply.created_at)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <form
                              onSubmit={(event) =>
                                handleConversationReply(event, post.id)
                              }
                              className="mt-4 flex flex-col gap-2 sm:flex-row"
                            >
                              <input
                                type="text"
                                value={replyInputs[replyKey] || ''}
                                onChange={(event) =>
                                  setReplyValue(replyKey, event.target.value)
                                }
                                placeholder="Write a reply..."
                                maxLength={1000}
                                className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 ${colors.input}`}
                              />

                              <button
                                type="submit"
                                disabled={
                                  !replyInputs[replyKey]?.trim() ||
                                  actionLoading[replyKey]
                                }
                                className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                {actionLoading[replyKey] ? 'Sending...' : 'Reply'}
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

            {/* Polls */}
            {tab === 'polls' && (
              <section className="mt-6 space-y-5">
                <div className={`rounded-2xl border p-5 ${colors.panel}`}>
                  <h2 className="text-xl font-bold">
                    {authorName}'s Polls
                  </h2>

                  <p className={`mt-1 text-sm ${colors.muted}`}>
                    Polls created by this reader.
                  </p>
                </div>

                {polls.length === 0 && (
                  <div className={`rounded-2xl border border-dashed p-10 text-center ${colors.border}`}>
                    <div className="text-4xl">📊</div>

                    <h3 className="mt-3 text-lg font-bold">
                      No polls yet
                    </h3>

                    <p className={`mt-2 text-sm ${colors.muted}`}>
                      This reader has not created any polls.
                    </p>
                  </div>
                )}

                {polls.map((poll) => {
                  const options = poll.options || []
                  const replyKey = `poll-reply-${poll.id}`
                  const voteKey = `vote-${poll.id}`

                  const totalVotes = options.reduce(
                    (total, option) => total + (option.votes || []).length,
                    0,
                  )

                  return (
                    <article
                      key={poll.id}
                      className={`rounded-2xl border p-5 sm:p-6 ${colors.panel}`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          src={poll.avatar || author.avatar}
                          username={poll.username || authorName}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {poll.username || authorName}
                          </p>

                          <p className={`text-xs ${colors.muted}`}>
                            {formatDate(poll.createdAt || poll.created_at)}
                          </p>

                          <h3 className="mt-4 text-lg font-bold">
                            {poll.question}
                          </h3>

                          <p className={`mt-1 text-xs ${colors.muted}`}>
                            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                          </p>

                          <div className="mt-4 space-y-3">
                            {options.map((option) => {
                              const votes = (option.votes || []).length

                              const percentage = totalVotes
                                ? Math.round((votes / totalVotes) * 100)
                                : 0

                              return (
                                <div
                                  key={option.id}
                                  className={`relative w-full overflow-hidden rounded-xl border p-3 ${colors.border}`}
                                >
                                  <span
                                    className={`absolute inset-y-0 left-0 ${
                                      isDark ? 'bg-[#49336F]' : 'bg-[#EAD9C7]'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />

                                  <span className="relative flex flex-wrap items-center justify-between gap-3">
                                    <span className="break-words text-sm font-medium">
                                      {option.text}
                                    </span>

                                    <span className="flex shrink-0 items-center gap-3">
                                      <span className="text-xs font-semibold">
                                        {percentage}%
                                      </span>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handlePollVote(poll.id, option.id)
                                        }
                                        disabled={actionLoading[voteKey]}
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${colors.primaryButton}`}
                                      >
                                        {actionLoading[voteKey] ? 'Please wait...' : 'Vote'}
                                      </button>
                                    </span>
                                  </span>
                                </div>
                              )
                            })}
                          </div>

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
                                    {formatDate(reply.createdAt || reply.created_at)}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <form
                              onSubmit={(event) =>
                                handlePollReply(event, poll.id)
                              }
                              className="mt-4 flex flex-col gap-2 sm:flex-row"
                            >
                              <input
                                type="text"
                                value={replyInputs[replyKey] || ''}
                                onChange={(event) =>
                                  setReplyValue(replyKey, event.target.value)
                                }
                                placeholder="Write a reply..."
                                maxLength={1000}
                                className={`min-w-0 flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500 ${colors.input}`}
                              />

                              <button
                                type="submit"
                                disabled={
                                  !replyInputs[replyKey]?.trim() ||
                                  actionLoading[replyKey]
                                }
                                className={`${buttonClass} disabled:cursor-not-allowed disabled:opacity-50`}
                              >
                                {actionLoading[replyKey] ? 'Sending...' : 'Reply'}
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
          </>
        )}

        {/* Report User Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
            <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${colors.panel}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  Report User
                </h2>

                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className={`text-2xl ${colors.muted}`}
                  aria-label="Close report form"
                >
                  ×
                </button>
              </div>

              <p className={`mt-2 text-sm ${colors.muted}`}>
                Report @{authorName} for inappropriate behaviour.
              </p>

              <form
                onSubmit={handleReportSubmit}
                className="mt-5 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Reason for reporting
                  </label>

                  <select
                    value={reportReason}
                    onChange={(event) =>
                      setReportReason(event.target.value)
                    }
                    required
                    className={`w-full rounded-xl border px-4 py-3 outline-none ${colors.input}`}
                  >
                    <option value="">Select a reason</option>
                    <option value="Harassment or bullying">
                      Harassment or bullying
                    </option>
                    <option value="Hate speech">Hate speech</option>
                    <option value="Spam or fake account">
                      Spam or fake account
                    </option>
                    <option value="Inappropriate content">
                      Inappropriate content
                    </option>
                    <option value="Impersonation">Impersonation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Additional details (optional)
                  </label>

                  <textarea
                    value={reportDetails}
                    onChange={(event) =>
                      setReportDetails(event.target.value)
                    }
                    rows={4}
                    maxLength={2000}
                    placeholder="Explain why you are reporting this user..."
                    className={`w-full resize-none rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 ${colors.input}`}
                  />

                  <p className={`mt-1 text-right text-xs ${colors.muted}`}>
                    {reportDetails.length}/2000
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold ${colors.secondaryButton}`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!reportReason || safetyLoading}
                    className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {safetyLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
