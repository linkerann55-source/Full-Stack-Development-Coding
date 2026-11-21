
export default function AdminUsers({
  filteredUsers,
  search,
  setSearch,
  filter,
  setFilter,
  inputStyle,
  tableHeadStyle,
  panelStyle,
  statusClass,
  toggleUserStatus,
  deleteUser,
  resetFilters,
}) {
  return (
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
            {filteredUsers.map((user) => {
              const status = user.is_suspended
                ? 'Suspended'
                : 'Active'

              return (
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
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(status)}`}
                    >
                      {status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(user)}
                        className="rounded-lg bg-[#f3eaff] px-3 py-2 text-xs font-semibold text-[#79549b] hover:bg-[#e8d9fb]"
                      >
                        {user.is_suspended ? 'Activate' : 'Suspend'}
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
              )
            })}
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
}
