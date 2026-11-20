
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  getAdminStories,
  publishAdminStory,
  unpublishAdminStory,
  deleteAdminStory,
} from '../api/admin'

const USERS_KEY = 'moonlit_pages_users'
const REPORTS_KEY = 'moonlit_pages_reports'

const seedUsers = [
  {
    id: 'user-1',
    username: 'Luna Rose',
    email: 'luna@example.com',
    role: 'Writer',
    status: 'Active',
  },
  {
    id: 'user-2',
    username: 'Aria Moon',
    email: 'aria@example.com',
    role: 'Writer',
    status: 'Active',
  },
  {
    id: 'user-3',
    username: 'Noah Grey',
    email: 'noah@example.com',
    role: 'Reader',
    status: 'Active',
  },
]

const seedReports = [
  {
    id: 'report-1',
    storyTitle: 'Example Story',
    reporter: 'Reader123',
    reason: 'Inappropriate content',
    status: 'Pending',
    createdAt: '2026-10-12',
  },
]

function readArray(key, fallback) {
  try {
    const saved = localStorage.getItem(key)

    if (saved === null) {
      localStorage.setItem(key, JSON.stringify(fallback))
      return fallback
    }

    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function saveArray(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Unable to save ${key}:`, error)
  }
}

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

  if (
    value === 'pending' ||
    value === 'draft'
  ) {
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

  // Load stories from Laravel and users/reports from localStorage
  useEffect(() => {
    const loadStories = async () => {
      try {
        const response = await getAdminStories()

        if (response.success) {
          setStories(response.stories || [])
        }
      } catch (error) {
        console.error('Unable to load admin stories:', error)

        setNotice(
          error.response?.data?.message ||
          'Unable to load stories from the server.'
        )
      }
    }

    loadStories()

    setUsers(readArray(USERS_KEY, seedUsers))
    setReports(readArray(REPORTS_KEY, seedReports))
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
    (report) =>
      (report.status || 'Pending').toLowerCase() === 'pending'
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

      const matchesSearch =
        username.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term)

      const matchesFilter =
        filter === 'All' ||
        (user.status || 'Active').toLowerCase() === filter.toLowerCase()

      return matchesSearch && matchesFilter
    })
  }, [users, search, filter])

  // Filter reports
  const filteredReports = useMemo(() => {
    const term = search.toLowerCase().trim()

    return reports.filter((report) => {
      const storyTitle = String(
        report.storyTitle || report.story || ''
      )

      const reporter = String(report.reporter || '')
      const reason = String(report.reason || '')

      const matchesSearch =
        storyTitle.toLowerCase().includes(term) ||
        reporter.toLowerCase().includes(term) ||
        reason.toLowerCase().includes(term)

      const matchesFilter =
        filter === 'All' ||
        (report.status || 'Pending').toLowerCase() ===
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

      // Reload stories from database
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

      // Remove deleted story from admin screen
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

  // Toggle user status
  const toggleUserStatus = (user) => {
    const nextStatus =
      (user.status || 'Active').toLowerCase() === 'active'
        ? 'Suspended'
        : 'Active'

    const updated = users.map((item) =>
      item.id === user.id
        ? { ...item, status: nextStatus }
        : item
    )

    setUsers(updated)
    saveArray(USERS_KEY, updated)

    refreshNotice(`User ${nextStatus.toLowerCase()}.`)
  }

  // Delete user from local admin list
  const deleteUser = (user) => {
    const name = user.username || user.name || 'this user'

    if (!window.confirm(`Delete ${name}?`)) return

    const updated = users.filter(
      (item) => item.id !== user.id
    )

    setUsers(updated)
    saveArray(USERS_KEY, updated)

    refreshNotice('User deleted.')
  }

  // Resolve report
  const resolveReport = (report) => {
    const updated = reports.map((item) =>
      item.id === report.id
        ? { ...item, status: 'Resolved' }
        : item
    )

    setReports(updated)
    saveArray(REPORTS_KEY, updated)

    refreshNotice('Report marked as resolved.')
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
