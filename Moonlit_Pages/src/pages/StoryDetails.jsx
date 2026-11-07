
import { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router-dom'
import { getStory } from '../api/stories.js'

export default function StoryDetails() {
  const { id } = useParams()
  const location = useLocation()
  const outletContext = useOutletContext() || {}
  const isDark = outletContext.theme === 'dark'

  const [story, setStory] = useState(location.state?.story || null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Theme colours
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

    panel: isDark
      ? 'border-[#3A2D50] bg-[#25183D]'
      : 'border-[#E7D9C9] bg-[#FFF9F1]',

    section: isDark
      ? 'border-[#3A2D50] bg-gradient-to-br from-[#25183D] via-[#1A122B] to-[#10091F]'
      : 'border-[#E7D9C9] bg-gradient-to-br from-[#FFF9F1] via-[#F5EBDD] to-[#EAD9C7]',

    button: isDark
      ? 'bg-[#8B6CCF] text-white hover:bg-[#7453B5]'
      : 'bg-[#A66B50] text-white hover:bg-[#89543F]',

    secondaryButton: isDark
      ? 'border-[#3A2D50] bg-[#1A122B] text-[#D6B779] hover:bg-[#33234C]'
      : 'border-[#E7D9C9] bg-white text-[#A66B50] hover:bg-[#F5EBDD]',
  }

  // Load story details and chapters from Laravel
  useEffect(() => {
    let isActive = true

    async function loadStory() {
      try {
        setIsLoading(true)
        setError('')

        const result = await getStory(id)

        if (isActive) {
          setStory(result)
        }
      } catch (err) {
        console.error('Unable to load story details:', err)

        if (isActive) {
          setError(
            'Unable to load this story. It may have been removed or is unavailable.'
          )
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadStory()

    return () => {
      isActive = false
    }
  }, [id])

  const chapters = Array.isArray(story?.chapters)
    ? [...story.chapters].sort(
        (a, b) => a.chapter_number - b.chapter_number
      )
    : []

  const author =
    story?.author ||
    story?.user?.name ||
    'Unknown Author'

  const coverImage =
    story?.cover_image ||
    story?.coverImage ||
    ''

  if (isLoading) {
    return (
      <main className={`min-h-screen ${colors.page}`}>
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <p className={colors.muted}>
            Loading story details...
          </p>
        </div>
      </main>
    )
  }

  if (error || !story) {
    return (
      <main className={`min-h-screen ${colors.page}`}>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="mb-5 text-5xl">📚</div>

          <h1 className={`mb-3 text-2xl font-bold ${colors.heading}`}>
            Story Not Found
          </h1>

          <p className={`mb-6 ${colors.muted}`}>
            {error || 'This story could not be found.'}
          </p>

          <Link
            to="/explore"
            className={`inline-block rounded-xl px-6 py-3 font-semibold ${colors.button}`}
          >
            Back to Explore
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className={`min-h-screen transition-colors duration-300 ${colors.page}`}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back navigation */}
        <Link
          to="/explore"
          className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-75 ${colors.accent}`}
        >
          ← Back to Explore
        </Link>

        {/* Story information */}
        <section className={`overflow-hidden rounded-3xl border ${colors.section}`}>
          <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-[260px_1fr] md:p-10">

            {/* Cover image */}
            <div className="mx-auto w-full max-w-[260px]">
              <div className={`relative aspect-[3/4] overflow-hidden rounded-2xl shadow-xl ${
                isDark
                  ? 'bg-gradient-to-br from-[#33234C] via-[#25183D] to-[#10091F]'
                  : 'bg-gradient-to-br from-[#EAD9C7] via-[#F5EBDD] to-[#D9BDA6]'
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
              </div>
            </div>

            {/* Story information */}
            <div className="flex flex-col justify-center">
              <span className={`mb-4 w-fit rounded-full border px-4 py-1.5 text-xs font-semibold ${colors.panel} ${colors.accent}`}>
                {story.genre || 'Other'}
              </span>

              <h1 className={`mb-4 text-3xl font-bold leading-tight sm:text-4xl ${colors.heading}`}>
                {story.title || 'Untitled Story'}
              </h1>

              <p className={`mb-5 text-sm ${colors.muted}`}>
                Written by{' '}
                <span className={`font-semibold ${colors.accent}`}>
                  {author}
                </span>
              </p>

              <div className={`mb-6 flex flex-wrap gap-4 text-sm ${colors.muted}`}>
                <span>📖 {chapters.length} Chapters</span>

                {Number(story.rating) > 0 && (
                  <span>★ {Number(story.rating).toFixed(1)} Rating</span>
                )}

                {Number(story.readers ?? story.views) > 0 && (
                  <span>
                    👁 {Number(story.readers ?? story.views).toLocaleString()} Reads
                  </span>
                )}
              </div>

              <div className={`border-t pt-5 ${isDark ? 'border-[#3A2D50]' : 'border-[#E7D9C9]'}`}>
                <h2 className={`mb-3 text-lg font-bold ${colors.heading}`}>
                  About This Story
                </h2>

                <p className={`whitespace-pre-line text-sm leading-7 ${colors.muted}`}>
                  {story.description || 'No story description available yet.'}
                </p>
              </div>

              {chapters.length > 0 && (
                <Link
                  to={`/reader/${story.id}/${chapters[0].id}`}
                  className={`mt-7 inline-flex w-fit items-center justify-center rounded-xl px-6 py-3 font-semibold transition ${colors.button}`}
                >
                  Start Reading →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Chapter list */}
        <section className="mt-10">
          <div className="mb-5">
            <p className={`mb-2 text-sm font-semibold uppercase tracking-widest ${colors.accent}`}>
              CONTINUE THE JOURNEY
            </p>

            <h2 className={`text-2xl font-bold sm:text-3xl ${colors.heading}`}>
              Chapters
            </h2>

            <p className={`mt-2 text-sm ${colors.muted}`}>
              Choose a chapter to start reading.
            </p>
          </div>

          {chapters.length > 0 ? (
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  to={`/reader/${story.id}/${chapter.id}`}
                  className={`group flex items-center justify-between gap-4 rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 ${
                    colors.panel
                  } ${
                    isDark
                      ? 'hover:border-[#8B6CCF] hover:bg-[#33234C]'
                      : 'hover:border-[#A66B50] hover:bg-[#F5EBDD]'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold ${
                      isDark
                        ? 'bg-[#33234C] text-[#D6B779]'
                        : 'bg-[#F5EBDD] text-[#A66B50]'
                    }`}>
                      {chapter.chapter_number}
                    </div>

                    <div className="min-w-0">
                      <p className={`mb-1 text-xs font-semibold uppercase tracking-wider ${colors.accent}`}>
                        Chapter {chapter.chapter_number}
                      </p>

                      <h3 className={`truncate font-semibold ${colors.heading}`}>
                        {chapter.title}
                      </h3>
                    </div>
                  </div>

                  <span className={`shrink-0 text-xl transition group-hover:translate-x-1 ${colors.accent}`}>
                    →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={`rounded-2xl border p-10 text-center ${colors.panel}`}>
              <div className="mb-4 text-4xl">📖</div>

              <h3 className={`mb-2 text-lg font-bold ${colors.heading}`}>
                No Chapters Yet
              </h3>

              <p className={`text-sm ${colors.muted}`}>
                The author hasn't added any chapters to this story yet.
                Please check back later.
              </p>
            </div>
          )}
        </section>

        {/* Bottom navigation */}
        <div className="mt-10 text-center">
          <Link
            to="/explore"
            className={`inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-semibold transition ${colors.secondaryButton}`}
          >
            ← Explore More Stories
          </Link>
        </div>

      </div>
    </main>
  )
}
