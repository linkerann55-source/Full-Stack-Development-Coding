
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ADMIN_EMAIL = 'admin@moonlitpages.com'
const ADMIN_PASSWORD = 'moonlit123'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(event) {
    event.preventDefault()
    setError('')

    const validEmail =
      email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()

    const validPassword = password === ADMIN_PASSWORD

    if (!validEmail || !validPassword) {
      setError('Access denied. Invalid admin email or password.')
      return
    }

    sessionStorage.setItem('moonlit_admin_logged_in', 'true')
    navigate('/admin', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F1FF] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#E5D7FA] bg-white p-8 shadow-xl shadow-purple-100 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EEE4FF] text-3xl">
            🌙
          </div>

          <h1 className="text-3xl font-bold text-[#4B2878]">
            Admin Login
          </h1>

          <p className="mt-2 text-sm text-[#88779E]">
            Moonlit Pages Administration
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#51376D]">
              Admin Email
            </label>

            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter admin email"
              className="w-full rounded-xl border border-[#E2D5F3] bg-[#FCFAFF] px-4 py-3 text-[#3E2A55] outline-none focus:border-[#A783D8] focus:ring-2 focus:ring-purple-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#51376D]">
              Admin Password
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-[#E2D5F3] bg-[#FCFAFF] px-4 py-3 text-[#3E2A55] outline-none focus:border-[#A783D8] focus:ring-2 focus:ring-purple-100"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-[#7950A8] px-4 py-3 font-semibold text-white transition hover:bg-[#633D90]"
          >
            Sign In to Admin
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#9A8BAA]">
          Authorized administrators only
        </p>
      </div>
    </main>
  )
}
