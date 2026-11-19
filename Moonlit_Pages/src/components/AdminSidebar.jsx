import { Link } from 'react-router-dom'

export default function AdminSidebar({
  menuItems,
  section,
  changeSection,
  pendingReports,
  handleLogout,
}) {
  return (
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
  )
}
