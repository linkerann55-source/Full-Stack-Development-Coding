import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminOverview from './admin/adminOverview'
import AdminStories from './admin/AdminStories'
import AdminUsers from './admin/AdminUsers'
import AdminReports from './admin/AdminReports'
import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'

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
    localStorage.removeItem('moonlit_admin_token')
    localStorage.removeItem('moonlit_admin_logged_in')
    localStorage.removeItem('moonlit_admin_user')

    navigate('/admin/login', { replace: true })
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

  return (
    <div
      className="min-h-screen text-[#493257]"
      style={{
        background:
          'linear-gradient(135deg, #f7f2ff 0%, #fff6fa 48%, #f1f5ff 100%)',
      }}
    >
      <div className="flex min-h-screen">
         <AdminSidebar
            menuItems={menuItems}
            section={section}
            changeSection={changeSection}
            pendingReports={pendingReports}
            handleLogout={handleLogout}
          />

        {/* Main content: no second sidebar */}
        <main className="min-w-0 flex-1">
          <AdminHeader pageTitle={pageTitle} />

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            {notice && (
              <div
                role="status"
                className="mb-5 rounded-xl border border-[#d9eee3] bg-[#effaf4] px-4 py-3 text-sm font-medium text-[#258568]"
              >
                {notice}
              </div>
            )}

            {section === 'overview' && (
              <AdminOverview
                stories={stories}
                publishedCount={publishedCount}
                users={users}
                pendingReports={pendingReports}
                draftCount={draftCount}
                getTitle={getTitle}
                getAuthor={getAuthor}
                getStatus={getStatus}
                statusClass={statusClass}
                panelStyle={panelStyle}
                changeSection={changeSection}
              />
            )}
            {section === 'stories' && (
              <AdminStories
                filteredStories={filteredStories}
                search={search}
                setSearch={setSearch}
                filter={filter}
                setFilter={setFilter}
                inputStyle={inputStyle}
                tableHeadStyle={tableHeadStyle}
                panelStyle={panelStyle}
                getTitle={getTitle}
                getAuthor={getAuthor}
                getStatus={getStatus}
                statusClass={statusClass}
                formatDate={formatDate}
                toggleStoryStatus={toggleStoryStatus}
                deleteStory={deleteStory}
                resetFilters={resetFilters}
              />
            )}
            {section === 'users' && (
            <AdminUsers
              filteredUsers={filteredUsers}
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              inputStyle={inputStyle}
              tableHeadStyle={tableHeadStyle}
              panelStyle={panelStyle}
              statusClass={statusClass}
              toggleUserStatus={toggleUserStatus}
              deleteUser={deleteUser}
              resetFilters={resetFilters}
            />
          )}
          {section === 'reports' && (
            <AdminReports
              filteredReports={filteredReports}
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              inputStyle={inputStyle}
              tableHeadStyle={tableHeadStyle}
              panelStyle={panelStyle}
              statusClass={statusClass}
              formatDate={formatDate}
              resolveReport={resolveReport}
              resetFilters={resetFilters}
            />
          )}
          </div>

          <footer className="px-5 pb-6 text-center text-xs text-[#a18eaf] sm:px-8">
            © {new Date().getFullYear()} Moonlit Pages Admin Workspace
          </footer>
        </main>
      </div>
    </div>
  )
}