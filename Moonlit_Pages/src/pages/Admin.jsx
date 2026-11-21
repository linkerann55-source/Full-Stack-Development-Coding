
import useAdmin, {
  getTitle,
  getAuthor,
  getStatus,
  formatDate,
  statusClass,
} from '../hooks/useAdmin'

import AdminOverview from './admin/adminOverview'
import AdminStories from './admin/AdminStories'
import AdminUsers from './admin/AdminUsers'
import AdminReports from './admin/AdminReports'
import AdminActivityLogs from './admin/AdminActivityLogs'

import AdminSidebar from '../components/AdminSidebar'
import AdminHeader from '../components/AdminHeader'

const menuItems = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'stories', label: 'Stories', icon: '▤' },
  { id: 'users', label: 'Users', icon: '♙' },
  { id: 'reports', label: 'Reports', icon: '⚑' },
  { id: 'activity-logs', label: 'Activity Logs', icon: '◷' },
]

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
  const {
    section,
    stories,
    users,
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
  } = useAdmin()

  const pageTitle = {
    overview: 'Overview',
    stories: 'Story Management',
    users: 'User Management',
    reports: 'Reports',
    'activity-logs': 'Activity Logs',
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

            {section === 'activity-logs' && (
              <AdminActivityLogs />
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