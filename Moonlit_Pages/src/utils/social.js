
const FOLLOW_KEY = 'moonlit_pages_following'
const FOLLOWERS_KEY = 'moonlit_pages_followers'
const PROFILE_KEY = 'moonlit_pages_profile'
const FOLLOW_EVENT = 'moonlit-following-updated'

function normalizeUsername(username) {
  return typeof username === 'string' ? username.trim() : ''
}

function getCurrentUsername() {
  try {
    const profile = JSON.parse(
      localStorage.getItem(PROFILE_KEY) || 'null'
    )

    return normalizeUsername(profile?.username) || 'Moonlight Reader'
  } catch {
    return 'Moonlight Reader'
  }
}

function readFollowing() {
  try {
    const data = JSON.parse(
      localStorage.getItem(FOLLOW_KEY) || '[]'
    )

    if (!Array.isArray(data)) return []

    const uniqueNames = new Map()

    data.forEach((name) => {
      if (typeof name !== 'string' || !name.trim()) return

      const cleanName = name.trim()
      uniqueNames.set(cleanName.toLowerCase(), cleanName)
    })

    return [...uniqueNames.values()]
  } catch {
    return []
  }
}

function readFollowersMap() {
  try {
    const data = JSON.parse(
      localStorage.getItem(FOLLOWERS_KEY) || '{}'
    )

    return data && typeof data === 'object' && !Array.isArray(data)
      ? data
      : {}
  } catch {
    return {}
  }
}

function notifyFollowingChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(FOLLOW_EVENT))
  }
}

export function getFollowing() {
  return readFollowing()
}

export function getFollowers(username) {
  const target = normalizeUsername(username)
  if (!target) return []

  const followersMap = readFollowersMap()

  const key = Object.keys(followersMap).find(
    (name) => name.toLowerCase() === target.toLowerCase()
  )

  const followers = key ? followersMap[key] : []

  return Array.isArray(followers)
    ? [
        ...new Set(
          followers.filter(
            (name) => typeof name === 'string' && name.trim()
          )
        ),
      ]
    : []
}

export function toggleFollow(username) {
  const target = normalizeUsername(username)
  const currentUser = getCurrentUsername()

  if (
    !target ||
    target.toLowerCase() === currentUser.toLowerCase()
  ) {
    return readFollowing()
  }

  const following = readFollowing()

  const alreadyFollowing = following.some(
    (name) => name.toLowerCase() === target.toLowerCase()
  )

  const updatedFollowing = alreadyFollowing
    ? following.filter(
        (name) => name.toLowerCase() !== target.toLowerCase()
      )
    : [...following, target]

  const followersMap = readFollowersMap()

  const targetKey =
    Object.keys(followersMap).find(
      (name) => name.toLowerCase() === target.toLowerCase()
    ) || target

  const currentFollowers = Array.isArray(followersMap[targetKey])
    ? followersMap[targetKey]
    : []

  followersMap[targetKey] = alreadyFollowing
    ? currentFollowers.filter(
        (name) => name.toLowerCase() !== currentUser.toLowerCase()
      )
    : currentFollowers.some(
        (name) => name.toLowerCase() === currentUser.toLowerCase()
      )
        ? currentFollowers
        : [...currentFollowers, currentUser]

  try {
    localStorage.setItem(
      FOLLOW_KEY,
      JSON.stringify(updatedFollowing)
    )

    localStorage.setItem(
      FOLLOWERS_KEY,
      JSON.stringify(followersMap)
    )

    notifyFollowingChanged()
    return updatedFollowing
  } catch (error) {
    console.error('Could not update follow relationship:', error)
    return following
  }
}

export function isFollowing(username) {
  const target = normalizeUsername(username)

  return (
    !!target &&
    readFollowing().some(
      (name) => name.toLowerCase() === target.toLowerCase()
    )
  )
}

export function subscribeToFollowing(callback) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener(FOLLOW_EVENT, callback)

  return () => {
    window.removeEventListener(FOLLOW_EVENT, callback)
  }
}
