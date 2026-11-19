
export default function AdminOverview({
  stories,
  publishedCount,
  users,
  pendingReports,
  draftCount,
  getTitle,
  getAuthor,
  getStatus,
  statusClass,
  panelStyle,
  changeSection,
}) {
  return (
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
}
