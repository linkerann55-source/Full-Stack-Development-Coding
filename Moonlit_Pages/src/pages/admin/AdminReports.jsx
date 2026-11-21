import { useState } from 'react'
import { deleteAdminReport } from '../../api/admin'

export default function AdminReports({
  filteredReports,
  search,
  setSearch,
  filter,
  setFilter,
  inputStyle,
  tableHeadStyle,
  panelStyle,
  statusClass,
  formatDate,
  resolveReport,
  resetFilters,
}) {
  const [adminNotes, setAdminNotes] = useState({})
  const [resolvingId, setResolvingId] = useState(null)

  const handleDelete = async (report) => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this report?'
    )

    if (!confirmed) return

    try {
      await deleteAdminReport(report.id)

      window.location.reload()
    } catch (error) {
      console.error('Unable to delete report:', error)

      alert(
        error.response?.data?.message ||
        'Unable to delete report.'
      )
    }
  }

    const handleResolve = async (report) => {
    const adminNote = adminNotes[report.id] || ''

    setResolvingId(report.id)

    try {
      await resolveReport(report, adminNote)
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <section className="overflow-hidden" style={panelStyle}>
      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#493257]">
            User Reports
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
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead style={tableHeadStyle}>
            <tr>
              <th className="px-5 py-4 font-semibold">Reported User</th>
              <th className="px-5 py-4 font-semibold">Reporter</th>
              <th className="px-5 py-4 font-semibold">Reason</th>
              <th className="px-5 py-4 font-semibold">Details</th>
              <th className="px-5 py-4 font-semibold">Date</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Admin Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredReports.map((report) => {
              const reportedUser =
                report.reported_user?.username ||
                report.reported_user?.name ||
                'Deleted User'

              const reporter =
                report.reporter?.username ||
                report.reporter?.name ||
                'Deleted User'

              const status = report.status || 'pending'

              return (
                <tr
                  key={report.id}
                  className="border-t border-[#f0e8f6]"
                >
                  <td className="px-5 py-4 font-semibold text-[#493257]">
                    @{reportedUser}
                  </td>

                  <td className="px-5 py-4 text-[#7f6c8c]">
                    @{reporter}
                  </td>

                  <td className="px-5 py-4 text-[#7f6c8c]">
                    {report.reason || 'Not specified'}
                  </td>

                  <td className="max-w-[220px] px-5 py-4 text-[#7f6c8c]">
                    <p className="line-clamp-2">
                      {report.details || 'No additional details'}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-[#7f6c8c]">
                    {formatDate(report.created_at)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                        status
                      )}`}
                    >
                      {status.charAt(0).toUpperCase() +
                        status.slice(1)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {status.toLowerCase() === 'pending' ? (
                      <div className="flex min-w-[180px] flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Admin note (optional)"
                          value={adminNotes[report.id] || ''}
                          onChange={(event) =>
                            setAdminNotes((previous) => ({
                              ...previous,
                              [report.id]: event.target.value,
                            }))
                          }
                          disabled={resolvingId === report.id}
                          className="w-full rounded-lg border border-[#e8dff0] px-3 py-2 text-xs outline-none focus:border-[#b69bd4]"
                        />

                        <button
                          type="button"
                          onClick={() => handleResolve(report)}
                          disabled={resolvingId === report.id}
                          className="rounded-lg bg-[#e5f7ef] px-3 py-2 text-xs font-semibold text-[#258568] hover:bg-[#d0f1e3] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {resolvingId === report.id
                            ? 'Resolving...'
                            : 'Resolve'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex min-w-[180px] flex-col gap-2">
                        <span className="text-xs text-[#9585a2]">Completed</span>

                        {report.admin_note && (
                          <p className="text-xs text-[#7f6c8c]">
                            Note: {report.admin_note}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(report)}
                          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Delete Report
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
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
}
