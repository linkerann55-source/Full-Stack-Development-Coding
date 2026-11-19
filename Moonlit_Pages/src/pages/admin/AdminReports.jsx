
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
  return (
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
}
