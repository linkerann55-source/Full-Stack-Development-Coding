
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  getAdminStories,
  publishAdminStory,
  unpublishAdminStory,
  deleteAdminStory,
  getAdminUsers,
  suspendAdminUser,
  activateAdminUser,
  deleteAdminUser,
  getAdminReports,
  resolveAdminReport,
} from '../api/admin'

// Story helpers
export function getTitle(story) {
  return story.title || story.name || 'Untitled Story'
}

export function getAuthor(story) {
  return (
    story.author ||
    story.author_name ||
    story.authorName ||
    story.user?.name ||
    story.username ||
    'Unknown Author'
  )
}

export function getStatus(story) {
  if (story.status) return story.status
  return story.published ? 'Published' : 'Draft'
}

export function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString()
}

export function statusClass(status) {
  const value = String(status || 'Active').toLowerCase()

  if (
    value === 'published' ||
    value === 'active' ||
    value === 'resolved'
  ) {
    return 'bg-emerald-50 text-emerald-700'
  }

  if (value === 'pending' || value === 'draft') {
    return 'bg-amber-50 text-amber-700'
  }

  if (
    value === 'suspended' ||
    value === 'rejected' ||
    value === 'unpublished'
  ) {
    return 'bg-rose-50 text-rose-700'
  }

  return 'bg-purple-50 text-purple-700'
}

export default function useAdmin() {
  const navigate = useNavigate()

  const [section, setSection] = useState('overview')
  const [stories, setStories] = useState([])
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [notice, setNotice] = useState('')

  // Load stories, users and reports from Laravel
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [
          storyResponse,
          userResponse,
          reportResponse,
        ] = await Promise.all([
          getAdminStories(),
          getAdminUsers(),
          getAdminReports(),
        ])

        if (storyResponse.success) {
          setStories(storyResponse.stories || [])
        }

        if (userResponse.success) {
          setUsers(userResponse.users || [])
        }

        if (reportResponse.success) {
          setReports(reportResponse.reports || [])
        }
      } catch (error) {
        console.error('Unable to load admin data:', error)

        setNotice(
          error.response?.data?.message ||
          'Unable to load admin data from the server.'
        )
      }
    }

    loadAdminData()
  }, [])

  // Automatically clear notification messages
  useEffect(() => {
    if (!notice) return

    const timer = window.setTimeout(() => {
      setNotice('')
    }, 2500)

    return () => window.clearTimeout(timer)
  }, [notice])

  const refreshNotice = (message) => {
    setNotice(message)
  }

  // Admin logout
  const handleLogout = () => {
    localStorage.removeItem('moonlit_admin_token')
    localStorage.removeItem('moonlit_admin_logged_in')
    localStorage.removeItem('moonlit_admin_user')

    navigate('/admin/login', { replace: true })
  }

  // Dashboard statistics
  const publishedCount = stories.filter(
    (story) => getStatus(story).toLowerCase() === 'published'
  ).length

  const draftCount = stories.filter(
    (story) => getStatus(story).toLowerCase() === 'draft'
  ).length

  const pendingReports = reports.filter(
    (report) => String(report.status || 'pending').toLowerCase() === 'pending'
  ).length

  // Filter stories
  const filteredStories = useMemo(() => {
    const term = search.toLowerCase().trim()

    return stories.filter((story) => {
      const matchesSearch =
        getTitle(story).toLowerCase().includes(term) ||
        getAuthor(story).toLowerCase().includes(term) ||
        String(story.genre || '').toLowerCase().includes(term)

      const matchesFilter =
        filter === 'All' ||
        getStatus(story).toLowerCase() === filter.toLowerCase()

      return matchesSearch && matchesFilter
    })
  }, [stories, search, filter])

  // Filter users
  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim()

    return users.filter((user) => {
      const username = String(user.username || user.name || '')
      const email = String(user.email || '')

      const status = user.is_suspended ? 'Suspended' : 'Active'

      const matchesSearch =
        username.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term)

      const matchesFilter =
        filter === 'All' ||
        status.toLowerCase() === filter.toLowerCase()

      return matchesSearch && matchesFilter
    })
  }, [users, search, filter])

  // Filter reports from database records
  const filteredReports = useMemo(() => {
    const term = search.toLowerCase().trim()

    return reports.filter((report) => {
      const reportedUser = String(
        report.reported_user?.username ||
        report.reported_user?.name ||
        ''
      )

      const reporter = String(
        report.reporter?.username ||
        report.reporter?.name ||
        ''
      )

      const reason = String(report.reason || '')
      const details = String(report.details || '')

      const matchesSearch =
        reportedUser.toLowerCase().includes(term) ||
        reporter.toLowerCase().includes(term) ||
        reason.toLowerCase().includes(term) ||
        details.toLowerCase().includes(term)

      const matchesFilter =
        filter === 'All' ||
        String(report.status || 'pending').toLowerCase() ===
          filter.toLowerCase()

      return matchesSearch && matchesFilter
    })
  }, [reports, search, filter])

  // Change admin section
  const changeSection = (nextSection) => {
    setSection(nextSection)
    setSearch('')
    setFilter('All')
  }

  // Publish / Unpublish story through Laravel API
  const toggleStoryStatus = async (story) => {
    try {
      const currentStatus = getStatus(story).toLowerCase()

      if (currentStatus === 'published') {
        await unpublishAdminStory(story.id)
        refreshNotice('Story unpublished successfully.')
      } else {
        await publishAdminStory(story.id)
        refreshNotice('Story published successfully.')
      }

      const response = await getAdminStories()

      if (response.success) {
        setStories(response.stories || [])
      }
    } catch (error) {
      console.error('Unable to update story:', error)

      refreshNotice(
        error.response?.data?.message ||
        'Unable to update story.'
      )
    }
  }

  // Delete story permanently through Laravel API
  const deleteStory = async (story) => {
    const confirmed = window.confirm(
      `Delete "${getTitle(story)}"? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      await deleteAdminStory(story.id)

      setStories((previous) =>
        previous.filter((item) => item.id !== story.id)
      )

      refreshNotice('Story deleted successfully.')
    } catch (error) {
      console.error('Unable to delete story:', error)

      refreshNotice(
        error.response?.data?.message ||
        'Unable to delete story.'
      )
    }
  }

  // Suspend or activate user through Laravel
  const toggleUserStatus = async (user) => {
    try {
      if (user.is_suspended) {
        await activateAdminUser(user.id)
        refreshNotice('User activated successfully.')
      } else {
        await suspendAdminUser(user.id)
        refreshNotice('User suspended successfully.')
      }

      const response = await getAdminUsers()

      if (response.success) {
        setUsers(response.users || [])
      }
    } catch (error) {
      console.error('Unable to update user:', error)

      refreshNotice(
        error.response?.data?.message ||
        'Unable to update user status.'
      )
    }
  }

  // Delete user permanently through Laravel
  const deleteUser = async (user) => {
    const name = user.username || user.name || 'this user'

    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) {
      return
    }

    try {
      await deleteAdminUser(user.id)

      setUsers((previous) =>
        previous.filter((item) => item.id !== user.id)
      )

      refreshNotice('User deleted successfully.')
    } catch (error) {
      console.error('Unable to delete user:', error)

      refreshNotice(
        error.response?.data?.message ||
        'Unable to delete user.'
      )
    }
  }

const resolveReport = async (report, adminNote = '') => {
  try {
    await resolveAdminReport(report.id, adminNote)

    const response = await getAdminReports()

    if (response.success) {
      setReports(response.reports || [])
    }

    refreshNotice('Report resolved successfully.')
  } catch (error) {
    console.error('Unable to resolve report:', error)

    refreshNotice(
      error.response?.data?.message ||
      'Unable to resolve report.'
    )
  }
}

  // Reset search and filters
  const resetFilters = () => {
    setSearch('')
    setFilter('All')
  }

  return {
    section,
    stories,
    users,
    reports,
    search,
    setSearch,
    filter,
    setFilter,
    notice,
    publishedCount,
    draftCount,
    pendingReports,
    filteredStories,
    filteredUsers,
    filteredReports,
    changeSection,
    handleLogout,
    toggleStoryStatus,
    deleteStory,
    toggleUserStatus,
    deleteUser,
    resolveReport,
    resetFilters,
  }
}
