
import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearNotifications,
  subscribeToNotifications,
} from '../utils/notifications.js'

const notificationIcons = {
  like: '💜',
  comment: '💬',
  follow: '🌙',
  reply: '↩️',
  activity: '🔔',
  warning: '⚠️',
  content_removed: '🗑️',
}

const API_ORIGIN = 'http://127.0.0.1:8000'

function getAvatarUrl(avatar) {
  if (!avatar || typeof avatar !== 'string') return null

  if (avatar.startsWith('data:image/')) {
    return avatar
  }

  let path = avatar

  // Fix URLs generated with localhost or an incorrect port
  if (/^https?:\/\//i.test(avatar)) {
    try {
      const parsedUrl = new URL(avatar)

      if (
        parsedUrl.hostname === 'localhost' ||
        parsedUrl.hostname === '127.0.0.1'
      ) {
        path = parsedUrl.pathname
      } else {
        return avatar
      }
    } catch {
      return null
    }
  }

  path = path.replace(/^\/+/, '')

  // Ignore emoji or other non-image avatar values
  if (!/\.(png|jpe?g|webp|gif)$/i.test(path)) {
    return null
  }

  if (path.startsWith('storage/')) {
    return `${API_ORIGIN}/${path}`
  }

  if (path.startsWith('avatars/')) {
    return `${API_ORIGIN}/storage/${path}`
  }

  return `${API_ORIGIN}/storage/${path}`
}

export default function Notifications() {
  const outletContext = useOutletContext() || {}
  const isDark = outletContext.theme === 'dark'

  const [notifications, setNotifications] = useState([])
  const [filter, setFilter] = useState('all')
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)
  const [loading, setLoading] = useState(true)

  const colors = {
    page: isDark
      ? 'bg-[#10091F] text-[#F5EFFB]'
      : 'bg-[#F5EBDD] text-[#49372E]',

    heading: isDark ? 'text-[#F5EFFB]' : 'text-[#49372E]',
    muted: isDark ? 'text-[#B9ADC9]' : 'text-[#88796F]',
    accent: isDark ? 'text-[#D6B779]' : 'text-[#A66B50]',
    border: isDark ? 'border-[#3A2D50]' : 'border-[#E7D9C9]',

    panel: isDark
      ? 'border-[#3A2D50] bg-[#25183D]'
      : 'border-[#E7D9C9] bg-[#FFF9F1]',

    primaryButton: isDark
      ? 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'
      : 'bg-[#A66B50] text-white hover:bg-[#89543F]',

    secondaryButton: isDark
      ? 'border-[#3A2D50] bg-[#25183D] text-[#D6B779] hover:bg-[#33234C]'
      : 'border-[#E7D9C9] bg-[#FFF9F1] text-[#A66B50] hover:bg-[#F5EBDD]',

    unreadCard: isDark
      ? 'border-[#8B6CCF]/40 bg-gradient-to-r from-[#25183D] to-[#1A122B]'
      : 'border-[#C79A7B] bg-gradient-to-r from-[#FFF9F1] to-[#F5EBDD]',

    readCard: isDark
      ? 'border-[#3A2D50] bg-[#1A122B]'
      : 'border-[#E7D9C9] bg-[#FFF9F1]',

    section: isDark
      ? 'border-[#3A2D50] bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
      : 'border-[#E7D9C9] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',
  }

  // Load notifications from Laravel
  const loadNotifications = useCallback(async () => {
    try {
      const data = await getNotifications()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()

    const unsubscribe = subscribeToNotifications(loadNotifications)

    return unsubscribe
  }, [loadNotifications])

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length

  const readCount = notifications.length - unreadCount

  const visibleNotifications = notifications.filter((notification) => {
    if (filter === 'unread') return !notification.read
    if (filter === 'read') return notification.read
    return true
  })

  async function handleMarkRead(id) {
    try {
      await markNotificationAsRead(id)
      await loadNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead()
      await loadNotifications()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteNotification(id)
      await loadNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  async function handleClearAll() {
    try {
      await clearNotifications()
      setShowClearConfirmation(false)
      await loadNotifications()
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }

  function getDestination(notification) {
    if (
      notification.type === 'follow' &&
      notification.profileUsername
    ) {
      return `/user/${encodeURIComponent(notification.profileUsername)}`
    }

    if (
      ['like', 'comment'].includes(notification.type) &&
      notification.storyId
    ) {
      return `/story/${notification.storyId}`
    }

    return null
  }

  return (
    <main
      className={`min-h-screen px-4 py-8 transition-colors duration-300 sm:px-6 lg:px-10 ${colors.page}`}
    >
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-8">
          <p className={`text-sm font-semibold uppercase tracking-[0.25em] ${colors.accent}`}>
            Stay connected
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className={`flex flex-wrap items-center gap-3 text-3xl font-bold sm:text-4xl ${colors.heading}`}>
                Notifications

                {unreadCount > 0 && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${colors.primaryButton}`}>
                    {unreadCount}
                  </span>
                )}
              </h1>

              <p className={`mt-3 ${colors.muted}`}>
                Keep up with what's happening in your reading community.
              </p>
            </div>

            {notifications.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${colors.secondaryButton}`}
                  >
                    Mark all as read
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowClearConfirmation(true)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    isDark
                      ? 'border-red-400/30 text-red-300 hover:bg-red-400/10'
                      : 'border-red-300 bg-[#FFF9F1] text-red-700 hover:bg-red-50'
                  }`}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Notification statistics */}
        <section className="mb-7 grid grid-cols-3 gap-3 sm:gap-4">
          <div className={`rounded-2xl border p-4 sm:p-5 ${colors.panel}`}>
            <p className={`text-xs sm:text-sm ${colors.muted}`}>
              All notifications
            </p>
            <p className={`mt-2 text-2xl font-bold ${colors.heading}`}>
              {notifications.length}
            </p>
          </div>

          <div className={`rounded-2xl border p-4 sm:p-5 ${colors.panel}`}>
            <p className={`text-xs sm:text-sm ${colors.muted}`}>
              Unread
            </p>
            <p className={`mt-2 text-2xl font-bold ${colors.accent}`}>
              {unreadCount}
            </p>
          </div>

          <div className={`rounded-2xl border p-4 sm:p-5 ${colors.panel}`}>
            <p className={`text-xs sm:text-sm ${colors.muted}`}>
              Read
            </p>
            <p className={`mt-2 text-2xl font-bold ${colors.heading}`}>
              {readCount}
            </p>
          </div>
        </section>

        {/* Filters */}
        <nav aria-label="Filter notifications" className="mb-5 flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'read', label: 'Read' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
                filter === option.value
                  ? `border-transparent ${colors.primaryButton}`
                  : colors.secondaryButton
              }`}
            >
              {option.label}
            </button>
          ))}
        </nav>

        {/* Clear confirmation */}
        {showClearConfirmation && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clear-notifications-title"
            className={`mb-6 rounded-2xl border p-5 ${colors.panel}`}
          >
            <h2
              id="clear-notifications-title"
              className={`font-semibold ${colors.heading}`}
            >
              Clear all notifications?
            </h2>

            <p className={`mt-2 text-sm leading-6 ${colors.muted}`}>
              This will permanently remove all your notifications.
              This action cannot be undone.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Yes, clear all
              </button>

              <button
                type="button"
                onClick={() => setShowClearConfirmation(false)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${colors.secondaryButton}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Notifications list */}
        {loading ? (
          <div className={`rounded-3xl border px-6 py-14 text-center ${colors.section}`}>
            <p className={colors.muted}>
              Loading notifications...
            </p>
          </div>
        ) : visibleNotifications.length > 0 ? (
          <div className="space-y-3">
            {visibleNotifications.map((notification) => {
              const destination = getDestination(notification)
              const avatarUrl = getAvatarUrl(notification.avatar)

              return (
                <article
                  key={notification.id}
                  className={`flex gap-3 rounded-2xl border p-4 transition duration-200 sm:gap-4 sm:p-5 ${
                    notification.read
                      ? colors.readCard
                      : colors.unreadCard
                  }`}
                >
                  {/* Profile photo */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border text-2xl ${colors.border} ${
                      isDark ? 'bg-[#33234C]' : 'bg-[#F5EBDD]'
                    }`}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${notification.username || 'User'} profile`}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      notificationIcons[notification.type] || '🌙'
                    )}
                  </div>

                  {/* Notification details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold ${colors.heading}`}>
                        {notification.username || 'Moonlit Pages'}
                      </span>

                      {!notification.read && (
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isDark ? 'bg-[#D6B779]' : 'bg-[#A66B50]'
                          }`}
                          aria-label="Unread"
                        />
                      )}
                    </div>

                    <p className={`mt-1 break-words text-sm leading-6 ${colors.muted}`}>
                      {notification.message}

                      {notification.target && (
                        <span className={`font-medium ${colors.accent}`}>
                          {' '}{notification.target}
                        </span>
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className={`text-xs ${colors.muted}`}>
                        {notification.time || 'Recently'}
                      </span>

                      {destination && (
                        <Link
                          to={destination}
                          onClick={() => {
                            if (!notification.read) {
                              handleMarkRead(notification.id)
                            }
                          }}
                          className={`text-xs font-semibold transition hover:underline ${colors.accent}`}
                        >
                          View details →
                        </Link>
                      )}

                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkRead(notification.id)}
                          className={`text-xs font-medium transition hover:underline ${colors.accent}`}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Delete notification */}
                  <button
                    type="button"
                    onClick={() => handleDelete(notification.id)}
                    aria-label={`Delete notification from ${notification.username || 'Moonlit Pages'}`}
                    title="Delete notification"
                    className={`h-9 shrink-0 rounded-lg px-2 transition ${
                      isDark
                        ? 'text-[#B9ADC9] hover:bg-red-400/10 hover:text-red-300'
                        : 'text-[#88796F] hover:bg-red-50 hover:text-red-700'
                    }`}
                  >
                    ✕
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className={`rounded-3xl border px-6 py-14 text-center ${colors.section}`}>
            <div className="text-5xl">
              {filter === 'unread' ? '✨' : '🔔'}
            </div>

            <h2 className={`mt-5 text-xl font-bold ${colors.heading}`}>
              {filter === 'unread'
                ? "You're all caught up!"
                : filter === 'read'
                  ? 'No read notifications'
                  : 'Nothing here yet'}
            </h2>

            <p className={`mx-auto mt-3 max-w-md text-sm leading-6 ${colors.muted}`}>
              {filter === 'unread'
                ? 'You have no unread notifications at the moment.'
                : filter === 'read'
                  ? 'Notifications you have read will appear here.'
                  : 'When activity happens in your reading community, your notifications will appear here.'}
            </p>

            <Link
              to="/explore"
              className={`mt-6 inline-flex rounded-xl px-5 py-3 text-sm font-semibold transition ${colors.primaryButton}`}
            >
              Explore Stories
            </Link>
          </div>
        )}

        {/* Footer */}
        <section className={`mt-10 rounded-2xl border p-5 text-center sm:p-6 ${colors.panel}`}>
          <p className={`text-sm leading-6 ${colors.muted}`}>
            Every like, comment, and new connection makes our community brighter.
          </p>

          <p className={`mt-2 text-sm font-semibold ${colors.accent}`}>
            Keep reading, keep writing, and keep shining. ✨
          </p>
        </section>
      </div>
    </main>
  )
}
