import api from '../api/axios'

const USER_KEY = 'moonlit_user'
const TOKEN_KEY = 'moonlit_token'

function getProfileKey(userId) {
  return userId
    ? `moonlit_pages_profile_${userId}`
    : 'moonlit_pages_profile'
}

function readProfile(userId) {
  try {
    return JSON.parse(
      localStorage.getItem(getProfileKey(userId)) || 'null'
    )
  } catch {
    return null
  }
}

// Get the currently logged-in user
export function getCurrentUser() {
  try {
    const user = JSON.parse(
      localStorage.getItem(USER_KEY) || 'null'
    )

    if (!user) return null

    const profile = readProfile(user.id)

    return {
      ...user,
      username:
        user.username ||
        profile?.username ||
        user.name ||
        user.email?.split('@')[0] ||
        'Reader',
      bio:
        profile?.bio ||
        'Lost in stories, found among the stars. ✨',
      favoriteGenre: profile?.favoriteGenre || 'Fantasy',
      avatar: profile?.avatar || '',
    }
  } catch (error) {
    console.error('Unable to load user profile:', error)
    return null
  }
}

// Save profile information locally
export function saveUserProfile(profileData) {
  const currentUser = getCurrentUser()

  if (!currentUser?.id) return null

  const profileKey = getProfileKey(currentUser.id)

  const currentProfile = JSON.parse(
    localStorage.getItem(profileKey) || '{}'
  )

  const updatedProfile = {
    ...currentProfile,
    ...profileData,
  }

  localStorage.setItem(
    profileKey,
    JSON.stringify(updatedProfile)
  )

  window.dispatchEvent(new Event('moonlit-auth-updated'))

  return updatedProfile
}

// Update registered user information in local session
export function updateCurrentUser(userData) {
  try {
    const currentUser = JSON.parse(
      localStorage.getItem(USER_KEY) || 'null'
    )

    if (!currentUser) return null

    const updatedUser = {
      ...currentUser,
      ...userData,
    }

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(updatedUser)
    )

    window.dispatchEvent(new Event('moonlit-auth-updated'))

    return updatedUser
  } catch (error) {
    console.error('Unable to update user:', error)
    throw new Error('Could not update your account.')
  }
}

// Log out from Laravel and clear the local session
export async function logoutUser() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)

    if (token) {
      await api.post('/logout')
    }
  } catch (error) {
    console.error('Logout API error:', error)
  } finally {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    window.dispatchEvent(new Event('moonlit-auth-updated'))
  }
}
