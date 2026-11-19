export default function AdminStories({
  filteredStories,
  search,
  setSearch,
  filter,
  setFilter,
  inputStyle,
  tableHeadStyle,
  getTitle,
  getAuthor,
  getStatus,
  statusClass,
  formatDate,
  toggleStoryStatus,
  deleteStory,
  resetFilters,
}) {
  return (
    <section className="overflow-hidden" style={inputStyle.panelStyle || undefined}>
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
}
