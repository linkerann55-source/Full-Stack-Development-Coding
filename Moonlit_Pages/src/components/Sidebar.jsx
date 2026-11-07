
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navItems = [
  { name: 'Home', path: '/', icon: '⌂', end: true },
  { name: 'Explore Stories', path: '/explore', icon: '⌕' },
  { name: 'Notifications', path: '/notifications', icon: '♧' },
  { name: 'My Library', path: '/library', icon: '▤' },
  { name: 'My Profile', path: '/profile', icon: '◎' },
  { name: 'Writer Studio', path: '/writer', icon: '✎' },
]

export default function Sidebar({
  theme = 'dark',
  setTheme = () => {},
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const isDark = theme === 'dark'

  const colors = {
    sidebar: isDark ? '#1A122B' : '#FFF9F1',
    heading: isDark ? 'text-[#F5EFFB]' : 'text-[#49372E]',
    text: isDark ? 'text-[#B9ADC9]' : 'text-[#49372E]',
    muted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    divider: isDark ? '#3A2D50' : '#E7D9C9',
    active: isDark
      ? 'bg-[#25183D] text-[#D6B779] border-[#8B6CCF]'
      : 'bg-[#F0E3D4] text-[#A66B50] border-[#A66B50]',
    hover: isDark
      ? 'hover:bg-[#25183D] hover:text-[#D6B779]'
      : 'hover:bg-[#F0E3D4] hover:text-[#A66B50]',
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation menu"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border shadow-lg transition lg:hidden"
        style={{
          backgroundColor: colors.sidebar,
          borderColor: colors.divider,
          color: isDark ? '#D6B779' : '#A66B50'
        }}
      >
        <span className="text-2xl">☰</span>
      </button>

      {/* Mobile overlay */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[270px] flex-col border-r transition-all duration-300 lg:sticky lg:top-0 lg:z-20 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          backgroundColor: colors.sidebar,
          borderColor: colors.divider
        }}
      >

        {/* Logo */}
        <div
          className="flex items-center justify-between border-b px-5 py-6"
          style={{ borderColor: colors.divider }}
        >
          <NavLink
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-3"
          >
            <div
              className="h-12 w-12 overflow-hidden rounded-xl shadow-sm"
              style={{
                backgroundColor: isDark ? '#25183D' : '#F5EBDD'
              }}
            >
              <img
                src={
                  isDark
                    ? '/images/logo2.png'
                    : '/images/moonlit-page.png'
                }
                alt="Moonlit Pages Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className={`text-lg font-bold ${colors.heading}`}>
                Moonlit Pages
              </h1>

              <p className={`text-xs ${colors.muted}`}>
                Your story universe
              </p>
            </div>
          </NavLink>

          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            className={`rounded-lg px-2 py-1 text-xl lg:hidden ${colors.text}`}
          >
            ×
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className={`mb-4 px-3 text-xs font-semibold uppercase tracking-[0.18em] ${colors.muted}`}>
            Main Menu
          </p>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? colors.active
                    : `border-transparent ${colors.text} ${colors.hover}`
                }`
              }
            >
              <span className="flex h-6 w-6 items-center justify-center text-xl">
                {item.icon}
              </span>

              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Appearance */}
        <div
          className="border-t p-4"
          style={{ borderColor: colors.divider }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-sm font-semibold ${colors.heading}`}>
                Appearance
              </p>

              <p className={`mt-1 text-xs ${colors.muted}`}>
                {isDark ? 'Midnight Library' : 'Daily Café'}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-label="Toggle Day and Night Mode"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-[#8B6CCF] focus:ring-[#D6B779]'
                  : 'bg-[#A66B50] focus:ring-[#D8BFA3]'
              }`}
            >
              <span
                className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm shadow-md transition-all duration-300 ${
                  isDark ? 'left-7' : 'left-1'
                }`}
              >
                {isDark ? '🌙' : '☀️'}
              </span>
            </button>
          </div>

          {/* Footer */}
          <div className={`mt-5 text-center text-xs ${colors.muted}`}>
            <p>Made for story lovers ✨</p>
            <p className="mt-1">
              © {new Date().getFullYear()} Moonlit Pages
            </p>
          </div>
        </div>

      </aside>
    </>
  )
}
