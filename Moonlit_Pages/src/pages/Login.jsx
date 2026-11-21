import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Login() {
  const navigate = useNavigate()

  const [theme, setTheme] = useState('night')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isDay = theme === 'day'

  const colors = {
    page: isDay ? 'bg-[#FFF7ED] text-[#3D2B24]' : 'bg-[#0B0718] text-white',
    card: isDay
      ? 'border-[#EAD8C8] bg-white shadow-orange-100'
      : 'border-purple-500/20 bg-[#171027] shadow-purple-950/30',
    heading: isDay ? 'text-[#70452F]' : 'text-purple-200',
    description: isDay ? 'text-[#92715E]' : 'text-purple-200/60',
    label: isDay ? 'text-[#634638]' : 'text-purple-100',
    input: isDay
      ? 'border-[#E8D5C5] bg-[#FDF2E9] text-[#3D2B24] placeholder:text-[#B49A89] focus:border-[#B77955]'
      : 'border-purple-400/20 bg-[#0F0A1C] text-white placeholder:text-purple-200/30 focus:border-purple-400',
    link: isDay
      ? 'text-[#A36342] hover:text-[#70452F]'
      : 'text-purple-300 hover:text-purple-200',
    button: isDay
      ? 'bg-[#B77955] hover:bg-[#A56745]'
      : 'bg-purple-600 hover:bg-purple-500',
    back: isDay
      ? 'text-[#A18A7B] hover:text-[#70452F]'
      : 'text-purple-200/40 hover:text-purple-300',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/login', {
        email,
        password,
      })

      localStorage.setItem('moonlit_token', response.data.token)
      localStorage.setItem(
        'moonlit_user',
        JSON.stringify(response.data.user)
      )

      navigate('/')
    } catch (err) {
      const errors = err.response?.data?.errors

      if (errors) {
        setError(Object.values(errors).flat()[0])
      } else {
        setError(
          err.response?.data?.message ||
          'Unable to log in. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className={`flex min-h-screen w-full items-center justify-center px-4 py-6 transition-colors duration-300 ${colors.page}`}
    >
      <section
        className={`relative w-full max-w-sm rounded-2xl border p-5 shadow-xl transition-colors duration-300 sm:p-6 ${colors.card}`}
      >
      <button
        type="button"
        onClick={() => setTheme(isDay ? 'night' : 'day')}
        className={`absolute right-4 top-4 flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
          isDay
            ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            : 'border-purple-400/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20'
        }`}
      >
        {isDay ? '☀️ Day' : '🌙 Night'}
      </button>

        <Link
          to="/"
          className={`mb-6 flex items-center justify-center gap-2 pt-8 text-sm font-semibold transition ${colors.link}`}
        >
          <img
            src={isDay ? '/images/moonlit-page.png' : '/images/logo2.png'}
            alt="Moonlit Pages Logo"
            className="h-10 w-8 object-contain"
          />
          <span>Moonlit Pages</span>
        </Link>

        <div className="mb-6 text-center">
          <div className="mb-3 text-3xl">
            {isDay ? '☕' : '🌙'}
          </div>

          <h1 className={`text-xl font-bold sm:text-2xl ${colors.heading}`}>
            Welcome Back
          </h1>

          <p className={`mt-2 text-sm ${colors.description}`}>
            {isDay
              ? 'Your cozy reading corner is waiting.'
              : 'Sign in to continue your story journey.'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className={`mb-1.5 block text-sm ${colors.label}`}
            >
              Email Address
            </label>

            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${colors.input}`}
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className={`mb-1.5 block text-sm ${colors.label}`}
            >
              Password
            </label>

            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition ${colors.input}`}
            />


          </div>
          

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${colors.button}`}
          >
            
            {loading ? 'Signing in...' : 'Login'}
          </button>
          
        </form>

        <p className={`mt-5 text-center text-sm ${colors.description}`}>
          Don't have an account?{' '}
          <Link
            to="/register"
            className={`font-semibold transition ${colors.link}`}
          >
            Register
          </Link>
        </p>

        <Link
          to="/"
          className={`mt-4 block text-center text-xs transition ${colors.back}`}
        >
          ← Back to Home
        </Link>
      </section>
    </main>
  )
}
