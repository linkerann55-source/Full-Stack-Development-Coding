import { reportStory } from '../api/profile.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom'

import { getStory } from '../api/stories.js'
import { getChapters } from '../api/chapters.js'

function extractStory(result) {
  return result?.story || result?.data?.story || result?.data || result
}

function extractChapters(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.chapters)) return result.chapters
  if (Array.isArray(result?.data?.chapters)) return result.data.chapters
  if (Array.isArray(result?.data)) return result.data

  return []
}

function getAuthorName(story) {
  if (typeof story?.author === 'object') {
    return (
      story.author?.name ||
      story.user?.name ||
      'Unknown Author'
    )
  }

  return (
    story?.author ||
    story?.authorName ||
    story?.user?.name ||
    story?.username ||
    'Unknown Author'
  )
}

function getAuthorUsername(story) {
  return (
    story?.user?.username ||
    story?.author?.username ||
    story?.username ||
    story?.author_username ||
    ''
  )
}

export default function StoryDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const outletContext = useOutletContext() || {}
  const isDark = outletContext.theme === 'dark'

  const [story, setStory] = useState(null)
  const [chapters, setChapters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportMessage, setReportMessage] = useState('')

  const colors = {
    page: isDark
      ? 'bg-[#10091F] text-[#F5EFFB]'
      : 'bg-[#F5EBDD] text-[#49372E]',

    heading: isDark
      ? 'text-[#F5EFFB]'
      : 'text-[#49372E]',

    muted: isDark
      ? 'text-[#B9ADC9]'
      : 'text-[#88796F]',

    accent: isDark
      ? 'text-[#D6B779]'
      : 'text-[#A66B50]',

    border: isDark
      ? 'border-[#3A2D50]'
      : 'border-[#E7D9C9]',

    panel: isDark
      ? 'border-[#3A2D50] bg-[#25183D]'
      : 'border-[#E7D9C9] bg-[#FFF9F1]',

    softPanel: isDark
      ? 'border-[#49385F] bg-[#1B1230]'
      : 'border-[#E7D9C9] bg-[#F5EBDD]',

    primaryButton: isDark
      ? 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'
      : 'bg-[#A66B50] text-white hover:bg-[#89543F]',

    secondaryButton: isDark
      ? 'border-[#49385F] bg-[#1B1230] text-[#D6B779] hover:border-[#8B6CCF]'
      : 'border-[#E7D9C9] bg-[#FFF9F1] text-[#A66B50] hover:border-[#A66B50]',
  }

  // Load story and its published chapters
  const loadStoryDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      const [storyResult, chapterResult] = await Promise.all([
        getStory(id),
        getChapters(id),
      ])

      const storyData = extractStory(storyResult)
      const chapterData = extractChapters(chapterResult)

      if (!storyData || !storyData.id) {
        throw new Error('Story not found.')
      }

      setStory(storyData)

      const sortedChapters = [...chapterData].sort((a, b) => {
        return (
          Number(a.chapter_number ?? a.chapterNumber ?? 0) -
          Number(b.chapter_number ?? b.chapterNumber ?? 0)
        )
      })

      setChapters(sortedChapters)
    } catch (err) {
      console.error('Unable to load story details:', err)

      setError(
        err.response?.status === 404
          ? 'This story could not be found.'
          : 'Unable to load this story. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadStoryDetails()
  }, [loadStoryDetails, refreshKey])

  // Story information
  const authorName = getAuthorName(story)
  const authorUsername = getAuthorUsername(story)

  const coverImage =
    story?.cover_image ||
    story?.coverImage ||
    ''

  const description =
    story?.description ||
    story?.summary ||
    'No description available for this story yet.'

  const genre = story?.genre || 'Other'

  const publishedChapters = useMemo(() => {
    return chapters.filter(
      (chapter) => chapter.status === 'published'
    )
  }, [chapters])

  const firstChapter = publishedChapters[0]

  // Start reading from the first published chapter
  function handleStartReading() {
    if (!firstChapter) return

    navigate(`/reader/${story.id}/${firstChapter.id}`)
  }

  // Open a selected chapter
  function handleOpenChapter(chapter) {
    if (!chapter?.id) return

    navigate(`/reader/${story.id}/${chapter.id}`)
  }

    async function handleReportSubmit(event) {
    event.preventDefault()

    if (!story?.id || !reportReason || reportLoading) return

    setReportLoading(true)
    setReportMessage('')

    try {
      await reportStory(story.id, {
        reason: reportReason,
        details: reportDetails.trim(),
      })

      setShowReportModal(false)
      setReportReason('')
      setReportDetails('')
      setReportMessage('Thank you. Your report has been submitted for review.')
    } catch (error) {
      console.error('Story report error:', error)

      setReportMessage(
        error.response?.data?.message || 'Unable to submit your report.'
      )
    } finally {
      setReportLoading(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <main className={`min-h-screen ${colors.page}`}>
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="mb-4 text-5xl">📖</div>

          <p className={colors.muted}>
            Loading story details...
          </p>
        </div>
      </main>
    )
  }

  // Error state
  if (error || !story) {
    return (
      <main className={`min-h-screen ${colors.page}`}>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="mb-4 text-5xl">🌙</div>

          <h1 className={`mb-3 text-2xl font-bold ${colors.heading}`}>
            Unable to Open Story
          </h1>

          <p className={`mb-6 ${colors.muted}`}>
            {error || 'This story is unavailable.'}
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className={`rounded-xl px-6 py-3 font-semibold ${colors.primaryButton}`}
            >
              Try Again
            </button>

            <Link
              to="/explore"
              className={`rounded-xl border px-6 py-3 font-semibold ${colors.secondaryButton}`}
            >
              Back to Explore
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${colors.page}`}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back navigation */}
        <Link
          to="/explore"
          className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-70 ${colors.accent}`}
        >
          ← Back to Explore
        </Link>

        {/* Story information */}
        <section className={`overflow-hidden rounded-3xl border ${colors.panel}`}>

          <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-[260px_1fr] md:gap-10">

            {/* Story cover */}
            <div className={`relative mx-auto h-80 w-full max-w-[260px] overflow-hidden rounded-2xl shadow-xl ${
              isDark
                ? 'bg-gradient-to-br from-[#49316B] via-[#25183D] to-[#10091F]'
                : 'bg-gradient-to-br from-[#D9BDA6] via-[#F5EBDD] to-[#EAD9C7]'
            }`}>
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={`${story.title} cover`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-8xl">
                  📖
                </div>
              )}

              <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                {genre}
              </span>
            </div>

            {/* Story details */}
            <div className="flex flex-col justify-center">

              <p className={`mb-3 text-xs font-bold uppercase tracking-[0.25em] ${colors.accent}`}>
                MOONLIT PAGES STORY
              </p>

              <h1 className={`mb-4 text-3xl font-bold sm:text-4xl ${colors.heading}`}>
                {story.title || 'Untitled Story'}
              </h1>

              {/* Author */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className={colors.muted}>
                  Written by
                </span>

                {authorUsername ? (
                  <Link
                    to={`/user/${encodeURIComponent(authorUsername)}`}
                    className={`font-semibold hover:underline ${colors.accent}`}
                  >
                    {authorName}
                  </Link>
                ) : (
                  <span className={`font-semibold ${colors.accent}`}>
                    {authorName}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className={`mb-6 whitespace-pre-line text-sm leading-7 ${colors.muted}`}>
                {description}
              </p>

              {/* Story statistics */}
              <div className={`mb-7 flex flex-wrap gap-3 text-sm ${colors.muted}`}>
                <span className={`rounded-xl border px-4 py-3 ${colors.softPanel}`}>
                  📚 {publishedChapters.length} Chapters
                </span>

                <span className={`rounded-xl border px-4 py-3 ${colors.softPanel}`}>
                  📖 {Number(story.readers ?? story.views ?? story.read_count ?? 0).toLocaleString()} Reads
                </span>

                {Number(story.rating) > 0 && (
                  <span className={`rounded-xl border px-4 py-3 ${colors.softPanel}`}>
                    ⭐ {Number(story.rating).toFixed(1)} Rating
                  </span>
                )}
              </div>

              {/* Start reading */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleStartReading}
                  disabled={!firstChapter}
                  className={`rounded-xl px-7 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${colors.primaryButton}`}
                >
                  {firstChapter ? 'Start Reading →' : 'No Published Chapters Yet'}
                </button>

                <button
                  type="button"
                  onClick={loadStoryDetails}
                  className={`rounded-xl border px-5 py-3 font-semibold transition ${colors.secondaryButton}`}
                >
                  ↻ Refresh
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReportMessage('')
                    setShowReportModal(true)
                  }}
                  className={`rounded-xl border px-5 py-3 font-semibold transition ${colors.secondaryButton}`}
                >
                  ⚑ Report Story
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Chapter list */}
        <section className="mt-10">

          <div className="mb-5">
            <p className={`mb-2 text-sm font-semibold uppercase tracking-[0.2em] ${colors.accent}`}>
              THE STORY CONTINUES
            </p>

            <h2 className={`text-2xl font-bold sm:text-3xl ${colors.heading}`}>
              Chapters
            </h2>

            <p className={`mt-2 text-sm ${colors.muted}`}>
              Choose a chapter to start reading.
            </p>
          </div>

          {publishedChapters.length > 0 ? (
            <div className="space-y-3">
              {publishedChapters.map((chapter, index) => {
                const chapterNumber =
                  chapter.chapter_number ??
                  chapter.chapterNumber ??
                  index + 1

                return (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => handleOpenChapter(chapter)}
                    className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 ${
                      colors.panel
                    } ${
                      isDark
                        ? 'hover:border-[#8B6CCF] hover:bg-[#302047]'
                        : 'hover:border-[#A66B50] hover:bg-[#FFF4E8]'
                    }`}
                  >
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                      isDark
                        ? 'bg-[#49316B] text-[#D6B779]'
                        : 'bg-[#F5EBDD] text-[#A66B50]'
                    }`}>
                      {chapterNumber}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className={`truncate font-semibold ${colors.heading}`}>
                        {chapter.title || `Chapter ${chapterNumber}`}
                      </h3>

                      <p className={`mt-1 text-xs ${colors.muted}`}>
                        Chapter {chapterNumber}
                      </p>
                    </div>

                    <span className={`shrink-0 text-sm font-semibold transition group-hover:translate-x-1 ${colors.accent}`}>
                      Read →
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className={`rounded-2xl border px-6 py-12 text-center ${colors.panel}`}>
              <div className="mb-4 text-5xl">📚</div>

              <h3 className={`mb-2 text-xl font-bold ${colors.heading}`}>
                No Published Chapters Yet
              </h3>

              <p className={`mx-auto max-w-md text-sm leading-6 ${colors.muted}`}>
                The author hasn't published any chapters for this story yet.
                Please check back later.
              </p>
            </div>
          )}
        </section>

        {/* Writer section */}
        <section className={`mt-10 rounded-3xl border p-6 text-center sm:p-8 ${colors.panel}`}>
          <div className="mb-3 text-4xl">✍️</div>

          <h2 className={`mb-2 text-xl font-bold ${colors.heading}`}>
            Enjoying this story?
          </h2>

          <p className={`mb-5 text-sm ${colors.muted}`}>
            Discover more stories from the Moonlit Pages community.
          </p>

          <Link
            to="/explore"
            className={`inline-flex rounded-xl px-6 py-3 font-semibold transition ${colors.primaryButton}`}
          >
            Explore More Stories
          </Link>
        </section>

      </div>

      {showReportModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${colors.panel}`}>
      <h2 className={`mb-2 text-xl font-bold ${colors.heading}`}>
        Report Story
      </h2>

      <p className={`mb-5 text-sm ${colors.muted}`}>
        Why are you reporting this story?
      </p>

      <form onSubmit={handleReportSubmit}>
        <label className={`mb-2 block text-sm font-semibold ${colors.heading}`}>
          Report reason
        </label>

        <select
          value={reportReason}
          onChange={(event) => setReportReason(event.target.value)}
          required
          className={`mb-4 w-full rounded-xl border p-3 outline-none ${
            isDark
              ? 'border-[#49385F] bg-[#1B1230] text-white'
              : 'border-[#E7D9C9] bg-white text-[#49372E]'
          }`}
        >
          <option value="">Select a reason</option>
          <option value="Harassment or bullying">Harassment or bullying</option>
          <option value="Hate speech">Hate speech</option>
          <option value="Inappropriate content">Inappropriate content</option>
          <option value="Violence or harmful content">Violence or harmful content</option>
          <option value="Copyright infringement">Copyright infringement</option>
          <option value="Spam or misleading content">Spam or misleading content</option>
          <option value="Other">Other</option>
        </select>

        <label className={`mb-2 block text-sm font-semibold ${colors.heading}`}>
          Additional details (optional)
        </label>

        <textarea
          value={reportDetails}
          onChange={(event) => setReportDetails(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Explain why this story should be reviewed..."
          className={`mb-5 w-full resize-none rounded-xl border p-3 outline-none ${
            isDark
              ? 'border-[#49385F] bg-[#1B1230] text-white placeholder:text-[#8F829F]'
              : 'border-[#E7D9C9] bg-white text-[#49372E] placeholder:text-[#A99A90]'
          }`}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowReportModal(false)}
            disabled={reportLoading}
            className={`rounded-xl border px-4 py-2 font-semibold ${colors.secondaryButton}`}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!reportReason || reportLoading}
            className={`rounded-xl px-5 py-2 font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${colors.primaryButton}`}
          >
            {reportLoading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{reportMessage && (
  <div className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl bg-[#25183D] px-5 py-3 text-sm text-white shadow-xl">
    {reportMessage}
  </div>
)}
    </main>
  )
}
