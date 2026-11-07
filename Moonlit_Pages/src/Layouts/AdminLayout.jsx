
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export default function AdminLayout() {
  const navigate = useNavigate()

  function handleLogout() {
    sessionStorage.removeItem('moonlit_admin_logged_in')
    navigate('/admin-login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#F7F1FF] text-[#4B2878] md:flex">

      {/* SINGLE ADMIN NAVIGATION */}
      <aside className="w-full shrink-0 border-b border-[#E5D7FA] bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="mb-8">
          <h1 className="text-xl font-bold">
            🌙 Moonlit Admin
          </h1>

          <p className="mt-2 text-sm text-[#88779E]">
            Administration Panel
          </p>
        </div>

        <nav>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition ${
                isActive
                  ? 'bg-[#EEE4FF] text-[#633D90]'
                  : 'text-[#78658E] hover:bg-[#F7F1FF]'
              }`
            }
          >
            <span>▦</span>
            <span>Dashboard</span>
          </NavLink>
        </nav>

        <div className="mt-8 border-t border-[#F0E8FA] pt-5">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl border border-[#E5D7FA] px-4 py-3 text-left text-sm font-semibold text-[#7950A8] transition hover:bg-[#F5EEFF]"
          >
            ↪ Log Out
          </button>
        </div>
      </aside>

      {/* ADMIN PAGE CONTENT — NO SECOND SIDEBAR */}
      <main className="min-w-0 flex-1 p-5 md:p-8">
        <Outlet />
      </main>

    </div>
  )
}
