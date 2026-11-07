import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const STORIES_KEY = 'moonlit_pages_stories'
const USERS_KEY = 'moonlit_pages_users'
const REPORTS_KEY = 'moonlit_pages_reports'

const seedStories = [
  {
    id: 'story-1',
    title: 'Moonlit Promise',
    author: 'Luna Rose',
    genre: 'Romance',
    status: 'Published',
    createdAt: '2026-10-10',
  },
  {
    id: 'story-2',
    title: 'Whispers of the Stars',
    author: 'Aria Moon',
    genre: 'Fantasy',
    status: 'Published',
    createdAt: '2026-10-11',
  },
  {
    id: 'story-3',
    title: 'The Last Letter',
    author: 'Noah Grey',
    genre: 'Mystery',
    status: 'Draft',
    createdAt: '2026-10-12',
  },
]

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

const menuItems = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'stories', label: 'Stories', icon: '▤' },
  { id: 'users', label: 'Users', icon: '♙' },
  { id: 'reports', label: 'Reports', icon: '⚑' },
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

function getTitle(story) {
  return story.title || story.name || 'Untitled Story'
}

function getAuthor(story) {
  return (
    story.author ||
    story.authorName ||
    story.username ||
    'Unknown Author'
  )
}

function getStatus(story) {
  if (story.status) return story.status
  return story.published ? 'Published' : 'Draft'
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString()
}

function statusClass(status) {
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

  if (value === 'suspended' || value === 'rejected') {
    return 'bg-rose-50 text-rose-700'
  }

  return 'bg-purple-50 text-purple-700'
}

const panelStyle = {
  background: 'linear-gradient(145deg, #ffffff 0%, #fffaff 100%)',
  border: '1px solid #eee5f7',
  borderRadius: '20px',
  boxShadow: '0 8px 30px rgba(75, 44, 105, 0.045)',
}

const inputStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e7dcef',
  color: '#40304f',
}

const tableHeadStyle = {
  backgroundColor: '#f8f2ff',
  color: '#735a89',
}

export default function Admin() {
  const navigate = useNavigate()

  const [section, setSection] = useState('overview')
  const [stories, setStories] = useState([])
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setStories(readArray(STORIES_KEY, seedStories))
    setUsers(readArray(USERS_KEY, seedUsers))
    setReports(readArray(REPORTS_KEY, seedReports))
  }, [])

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

  const handleLogout = () => {
    sessionStorage.removeItem('moonlit_admin_logged_in')
    navigate('/admin-login', { replace: true })
  }

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

  const changeSection = (nextSection) => {
    setSection(nextSection)
    setSearch('')
    setFilter('All')
  }

  const toggleStoryStatus = (story) => {
    const nextStatus =
      getStatus(story).toLowerCase() === 'published'
        ? 'Draft'
        : 'Published'

    const updated = stories.map((item) =>
      item.id === story.id
        ? {
            ...item,
            status: nextStatus,
            published: nextStatus === 'Published',
          }
        : item
    )

    setStories(updated)
    saveArray(STORIES_KEY, updated)

    refreshNotice(
      `Story changed to ${nextStatus.toLowerCase()}.`
    )
  }

  const deleteStory = (story) => {
    const confirmed = window.confirm(
      `Delete "${getTitle(story)}"? This cannot be undone.`
    )

    if (!confirmed) return

    const updated = stories.filter(
      (item) => item.id !== story.id
    )

    setStories(updated)
    saveArray(STORIES_KEY, updated)
    refreshNotice('Story deleted.')
  }

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

  const resetFilters = () => {
    setSearch('')
    setFilter('All')
  }

  const pageTitle = {
    overview: 'Overview',
    stories: 'Story Management',
    users: 'User Management',
    reports: 'Reports',
  }[section]

  const renderOverview = () => (
    <div className="space-y-7">
      <div>
        <p className="text-sm text-[#8d7b9e]">
          Welcome back to your workspace.
        </p>
        <h2 className="mt-1 text-2xl font-bold text-[#382448]">
          Your platform at a glance
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total Stories',
            value: stories.length,
            icon: '▤',
            color: '#eee4ff',
            textColor: '#7952a5',
          },
          {
            label: 'Published Stories',
            value: publishedCount,
            icon: '✦',
            color: '#e1f7ef',
            textColor: '#258568',
          },
          {
            label: 'Total Users',
            value: users.length,
            icon: '♙',
            color: '#e5efff',
            textColor: '#527bc2',
          },
          {
            label: 'Pending Reports',
            value: pendingReports,
            icon: '⚑',
            color: '#ffe8f0',
            textColor: '#bf5c86',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-[20px] border border-[#eee5f7] bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-[#897998]">
                {item.label}
              </span>

              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                style={{
                  backgroundColor: item.color,
                  color: item.textColor,
                }}
              >
                {item.icon}
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-[#382448]">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="p-5 sm:p-6" style={panelStyle}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#493257]">
                Recent Stories
              </h3>
              <p className="mt-1 text-sm text-[#9585a2]">
                Recently added to the platform
              </p>
            </div>

            <button
              type="button"
              onClick={() => changeSection('stories')}
              className="text-sm font-semibold text-[#9468ba] hover:text-[#68428d]"
            >
              View all →
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {stories.slice(0, 4).map((story) => (
              <div
                key={story.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[#fcf9ff] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#4a3659]">
                    {getTitle(story)}
                  </p>
                  <p className="mt-1 text-xs text-[#9585a2]">
                    by {getAuthor(story)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                    getStatus(story)
                  )}`}
                >
                  {getStatus(story)}
                </span>
              </div>
            ))}

            {stories.length === 0 && (
              <p className="py-6 text-center text-sm text-[#9585a2]">
                No stories yet.
              </p>
            )}
          </div>
        </section>

        <section className="p-5 sm:p-6" style={panelStyle}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#493257]">
                Community Overview
              </h3>
              <p className="mt-1 text-sm text-[#9585a2]">
                User activity and moderation
              </p>
            </div>

            <span className="rounded-full bg-[#f3eaff] px-3 py-1 text-xs font-semibold text-[#895eae]">
              Admin
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-[#f9f5ff] p-4">
              <div>
                <p className="font-semibold text-[#4a3659]">
                  Draft stories
                </p>
                <p className="mt-1 text-sm text-[#9585a2]">
                  Stories not yet published
                </p>
              </div>

              <span className="text-2xl font-bold text-[#8962b0]">
                {draftCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-[#fff4f8] p-4">
              <div>
                <p className="font-semibold text-[#4a3659]">
                  Open reports
                </p>
                <p className="mt-1 text-sm text-[#9585a2]">
                  Reports waiting for review
                </p>
              </div>

              <span className="text-2xl font-bold text-[#c56c91]">
                {pendingReports}
              </span>
            </div>

            <button
              type="button"
              onClick={() => changeSection('reports')}
              className="w-full rounded-xl border border-[#eadcf5] px-4 py-3 text-sm font-semibold text-[#79549b] transition hover:bg-[#f8f0ff]"
            >
              Review reports →
            </button>
          </div>
        </section>
      </div>
    </div>
  )

  const renderStories = () => (
    <section className="overflow-hidden" style={panelStyle}>
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#493257]">
            All Stories
          </h2>
          <p className="mt-1 text-sm text-[#9585a2]">
            Review, publish, or remove stories.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search stories..."
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b69bd4] sm:w-56"
            style={inputStyle}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm outline-none"
            style={inputStyle}
          >
            <option>All</option>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead style={tableHeadStyle}>
            <tr>
              <th className="px-5 py-4 font-semibold">Story</th>
              <th className="px-5 py-4 font-semibold">Author</th>
              <th className="px-5 py-4 font-semibold">Genre</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Date</th>
              <th className="px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredStories.map((story) => (
              <tr
                key={story.id}
                className="border-t border-[#f0e8f6]"
              >
                <td className="px-5 py-4 font-semibold text-[#493257]">
                  {getTitle(story)}
                </td>
                <td className="px-5 py-4 text-[#7f6c8c]">
                  {getAuthor(story)}
                </td>
                <td className="px-5 py-4 text-[#7f6c8c]">
                  {story.genre || 'Uncategorized'}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                      getStatus(story)
                    )}`}
                  >
                    {getStatus(story)}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#7f6c8c]">
                  {formatDate(story.createdAt || story.created_at)}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleStoryStatus(story)}
                      className="rounded-lg bg-[#f3eaff] px-3 py-2 text-xs font-semibold text-[#79549b] hover:bg-[#e8d9fb]"
                    >
                      {getStatus(story).toLowerCase() === 'published'
                        ? 'Unpublish'
                        : 'Publish'}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteStory(story)}
                      className="rounded-lg bg-[#fff0f4] px-3 py-2 text-xs font-semibold text-[#b65378] hover:bg-[#ffe0e9]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStories.length === 0 && (
          <div className="p-10 text-center text-sm text-[#9585a2]">
            No stories match your search.
            <button
              type="button"
              onClick={resetFilters}
              className="ml-2 font-semibold text-[#9468ba]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  )

  const renderUsers = () => (
    <section className="overflow-hidden" style={panelStyle}>
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#493257]">
            All Users
          </h2>
          <p className="mt-1 text-sm text-[#9585a2]">
            Review member accounts and account status.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b69bd4] sm:w-56"
            style={inputStyle}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm outline-none"
            style={inputStyle}
          >
            <option>All</option>
            <option>Active</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead style={tableHeadStyle}>
            <tr>
              <th className="px-5 py-4 font-semibold">Username</th>
              <th className="px-5 py-4 font-semibold">Email</th>
              <th className="px-5 py-4 font-semibold">Role</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-t border-[#f0e8f6]"
              >
                <td className="px-5 py-4 font-semibold text-[#493257]">
                  {user.username || user.name || 'Unnamed User'}
                </td>
                <td className="px-5 py-4 text-[#7f6c8c]">
                  {user.email || '—'}
                </td>
                <td className="px-5 py-4 text-[#7f6c8c]">
                  {user.role || 'Reader'}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                      user.status
                    )}`}
                  >
                    {user.status || 'Active'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleUserStatus(user)}
                      className="rounded-lg bg-[#f3eaff] px-3 py-2 text-xs font-semibold text-[#79549b] hover:bg-[#e8d9fb]"
                    >
                      {(user.status || 'Active').toLowerCase() === 'active'
                        ? 'Suspend'
                        : 'Activate'}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteUser(user)}
                      className="rounded-lg bg-[#fff0f4] px-3 py-2 text-xs font-semibold text-[#b65378] hover:bg-[#ffe0e9]"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-10 text-center text-sm text-[#9585a2]">
            No users match your search.
            <button
              type="button"
              onClick={resetFilters}
              className="ml-2 font-semibold text-[#9468ba]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  )

  const renderReports = () => (
    <section className="overflow-hidden" style={panelStyle}>
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#493257]">
            Content Reports
          </h2>
          <p className="mt-1 text-sm text-[#9585a2]">
            Review reports submitted by community members.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search reports..."
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b69bd4] sm:w-56"
            style={inputStyle}
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl px-4 py-2.5 text-sm outline-none"
            style={inputStyle}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Resolved</option>
          </select>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead style={tableHeadStyle}>
            <tr>
              <th className="px-5 py-4 font-semibold">Reported Story</th>
              <th className="px-5 py-4 font-semibold">Reporter</th>
              <th className="px-5 py-4 font-semibold">Reason</th>
              <th className="px-5 py-4 font-semibold">Date</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredReports.map((report) => (
              <tr
                key={report.id}
                className="border-t border-[#f0e8f6]"
              >
                <td className="px-5 py-4 font-semibold text-[#493257]">
                  {report.storyTitle || report.story || 'Unknown Story'}
                </td>
                <td className="px-5 py-4 text-[#7f6c8c]">
                  {report.reporter || 'Anonymous'}
                </td>
                <td className="px-5 py-4 text-[#7f6c8c]">
                  {report.reason || 'Not specified'}
                </td>
                <td className="px-5 py-4 text-[#7f6c8c]">
                  {formatDate(report.createdAt || report.created_at)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                      report.status || 'Pending'
                    )}`}
                  >
                    {report.status || 'Pending'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {(report.status || 'Pending').toLowerCase() ===
                  'pending' ? (
                    <button
                      type="button"
                      onClick={() => resolveReport(report)}
                      className="rounded-lg bg-[#e5f7ef] px-3 py-2 text-xs font-semibold text-[#258568] hover:bg-[#d0f1e3]"
                    >
                      Resolve
                    </button>
                  ) : (
                    <span className="text-xs text-[#9585a2]">
                      Completed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredReports.length === 0 && (
          <div className="p-10 text-center text-sm text-[#9585a2]">
            No reports match your search.
            <button
              type="button"
              onClick={resetFilters}
              className="ml-2 font-semibold text-[#9468ba]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  )

  return (
    <div
      className="min-h-screen text-[#493257]"
      style={{
        background:
          'linear-gradient(135deg, #f7f2ff 0%, #fff6fa 48%, #f1f5ff 100%)',
      }}
    >
      <div className="flex min-h-screen">
        {/* Only one admin sidebar */}
        <aside className="sticky top-0 flex h-screen w-[245px] shrink-0 flex-col border-r border-[#eadff4] bg-white/90 px-4 py-6">
          <Link to="/" className="mb-9 flex items-center gap-3 px-2">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eee3ff] text-2xl text-[#8459a8]">
              ☾
            </span>

            <span>
              <span className="block text-base font-bold text-[#493257]">
                Moonlit Pages
              </span>
              <span className="mt-0.5 block text-xs text-[#9585a2]">
                Admin Workspace
              </span>
            </span>
          </Link>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ac9ab9]">
            Main Menu
          </p>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const active = section === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => changeSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? 'bg-[#eee4ff] text-[#78509d] shadow-sm'
                      : 'text-[#8c7a9a] hover:bg-[#faf6ff] hover:text-[#78509d]'
                  }`}
                >
                  <span className="w-5 text-center text-lg">
                    {item.icon}
                  </span>

                  {item.label}

                  {item.id === 'reports' && pendingReports > 0 && (
                    <span className="ml-auto rounded-full bg-[#ffe5ef] px-2 py-0.5 text-[10px] font-bold text-[#b65378]">
                      {pendingReports}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto border-t border-[#f0e7f6] pt-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#b65378] transition hover:bg-[#fff0f5]"
            >
              <span className="w-5 text-center text-lg">↪</span>
              Log Out
            </button>

            <div
              className="mt-5 rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, #f0e7ff 0%, #fff0f6 100%)',
              }}
            >
              <p className="text-xs font-bold text-[#76558e]">
                Keep the community magical ✨
              </p>
              <p className="mt-1 text-xs leading-5 text-[#9580a4]">
                Help make Moonlit Pages a welcoming place for readers and writers.
              </p>
            </div>
          </div>
        </aside>

        {/* Main content: no second sidebar */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex min-h-[82px] items-center justify-between gap-4 border-b border-[#eadff4] bg-white/85 px-5 backdrop-blur-md sm:px-8">
            <div>
              <p className="text-xs font-medium text-[#a18eaf]">
                Moonlit Pages / Admin
              </p>

              <h1 className="mt-1 text-xl font-bold text-[#493257]">
                {pageTitle}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[#493257]">
                  Administrator
                </p>
                <p className="mt-0.5 text-xs text-[#9585a2]">
                  Platform management
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eee4ff] text-lg font-bold text-[#79549b]">
                A
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            {notice && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-[#d9eee3] bg-[#effaf4] px-4 py-3 text-sm font-medium text-[#258568]"
              >
                {notice}
              </div>
            )}

            {section === 'overview' && renderOverview()}
            {section === 'stories' && renderStories()}
            {section === 'users' && renderUsers()}
            {section === 'reports' && renderReports()}
          </div>

          <footer className="px-5 pb-6 text-center text-xs text-[#a18eaf] sm:px-8">
            © {new Date().getFullYear()} Moonlit Pages Admin Workspace
          </footer>
        </main>
      </div>
    </div>
  )
}