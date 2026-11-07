
import api from '../api/axios'

const PROFILE_KEY = 'moonlit_pages_profile'
const USER_KEY = 'moonlit_user'
const TOKEN_KEY = 'moonlit_token'

function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null')
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

    const profile = readProfile()

    if (!user) return null

    return {
      ...user,
      username:
        profile?.username ||
        user.name ||
        user.username ||
        user.email?.split('@')[0] ||
        'Reader',
      bio:
        profile?.bio ||
        'Lost in stories, found among the stars. ✨',
      favoriteGenre:
        profile?.favoriteGenre || 'Fantasy',
      avatar: profile?.avatar || '',
    }
  } catch (error) {
    console.error('Unable to load user profile:', error)
    return null
  }
}

// Save profile information locally
export function saveUserProfile(profileData) {
  const currentProfile = JSON.parse(
    localStorage.getItem('moonlit_pages_profile') || '{}'
  )

  const updatedProfile = {
    ...currentProfile,
    ...profileData,
  }

  localStorage.setItem(
    'moonlit_pages_profile',
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

    window.dispatchEvent(
      new Event('moonlit-auth-updated')
    )

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
    localStorage.removeItem(PROFILE_KEY)

    window.dispatchEvent(
      new Event('moonlit-auth-updated')
    )
  }
}


