
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function Layout() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('moonlit_pages_theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  const isDark = theme === 'dark'

  useEffect(() => {
    try {
      localStorage.setItem('moonlit_pages_theme', theme)
    } catch {
      // Storage may be unavailable.
    }

    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }, [theme, isDark])

  const backgroundColor = isDark ? '#10091F' : '#F5EBDD'
  const textColor = isDark ? '#F5EFFB' : '#49372E'

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor,
        color: textColor
      }}
    >
      <div className="min-h-screen lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">

        <Sidebar
          theme={theme}
          setTheme={setTheme}
        />

        <main
          className="min-h-screen min-w-0 transition-colors duration-300"
          style={{ backgroundColor }}
        >
          <div className="px-4 pb-8 pt-20 sm:px-6 lg:px-8 lg:pt-8">
            <Outlet context={{ theme, setTheme }} />
          </div>
        </main>

      </div>
    </div>
  )
}
