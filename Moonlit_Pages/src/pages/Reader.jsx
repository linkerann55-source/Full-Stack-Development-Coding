
import { useCallback, useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams,
  useOutletContext,
} from 'react-router-dom'

import { getStory } from '../api/stories.js'
import { getChapters } from '../api/chapters.js'
import { reportComment } from '../api/profile.js'

import {
  getComments,
  addComment,
  updateComment,
  deleteComment,
} from '../utils/comments.js'

import { getCurrentUser } from '../utils/auth.js'

const BOOKMARKS_KEY = 'moonlit_pages_bookmarks'
const HISTORY_KEY = 'moonlit_pages_reading_history'

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function saveList(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

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

function extractComments(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.comments)) return result.comments
  if (Array.isArray(result?.data?.comments)) return result.data.comments
  return []
}

function normalizeStory(data) {
  if (!data) return null

  return {
    ...data,
    coverImage: data.cover_image || data.coverImage || '',
    allowScreenshots: Boolean(
      data.allow_screenshots ?? data.allowScreenshots
    ),
    author:
      typeof data.author === 'object'
        ? data.author?.name || data.user?.name || 'Anonymous'
        : data.author || data.user?.name || 'Anonymous',
  }
}

export default function Reader() {
  const { id: storyId, chapterId } = useParams()
  const navigate = useNavigate()

  const outletContext = useOutletContext() || {}
  const isDark = outletContext.theme !== 'light'

  const [currentUser] = useState(() => getCurrentUser())

  const [story, setStory] = useState(null)
  const [storyLoading, setStoryLoading] = useState(true)
  const [storyError, setStoryError] = useState('')

  const [chapters, setChapters] = useState([])
  const [chaptersLoading, setChaptersLoading] = useState(true)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)

  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')

  // Comment report states
  const [showCommentReportModal, setShowCommentReportModal] = useState(false)
  const [reportingCommentId, setReportingCommentId] = useState(null)
  const [commentReportReason, setCommentReportReason] = useState('')
  const [commentReportDetails, setCommentReportDetails] = useState('')
  const [commentReportLoading, setCommentReportLoading] = useState(false)

  const [bookmarks, setBookmarks] = useState(() =>
    readList(BOOKMARKS_KEY)
  )

  const [message, setMessage] = useState('')

  // Reset page state
  useEffect(() => {
    setStory(null)
    setStoryError('')
    setStoryLoading(true)
    setChapters([])
    setChaptersLoading(true)
    setCurrentChapterIndex(0)
    setMessage('')
  }, [storyId])

  // Theme colours
  const colors = {
    page: isDark
      ? 'bg-[#10091F] text-[#F5EFFB]'
      : 'bg-[#F5EBDD] text-[#49372E]',

    heading: isDark ? 'text-white' : 'text-[#3D2C25]',
    muted: isDark ? 'text-[#D0C2E2]' : 'text-[#705B50]',
    accent: isDark ? 'text-[#D7B9FF]' : 'text-[#70458F]',
    link: isDark
      ? 'text-[#D7B9FF] hover:text-white'
      : 'text-[#70458F] hover:text-[#49372E]',

    card: isDark
      ? 'border-[#493565] bg-[#1B1230]'
      : 'border-[#D9C8B8] bg-[#FFF9F2]',

    header: isDark
      ? 'border-[#493565] bg-[#211535]'
      : 'border-[#D9C8B8] bg-[#FFF9F2]',

    content: isDark ? 'text-[#F3ECFA]' : 'text-[#49372E]',

    button: isDark
      ? 'border-[#70558F] bg-[#35234D] text-white hover:bg-[#493565]'
      : 'border-[#C9B3DE] bg-[#EDE1F5] text-[#49372E] hover:bg-[#E1D0ED]',

    secondaryButton: isDark
      ? 'border-[#70558F] text-[#E5D5F5] hover:bg-[#35234D]'
      : 'border-[#C9B3DE] text-[#49372E] hover:bg-[#EDE1F5]',

    divider: isDark ? 'border-[#493565]' : 'border-[#E3D2C2]',
    message: isDark ? 'text-[#D7B9FF]' : 'text-[#70458F]',
  }

  // Load story from API
  const loadStory = useCallback(async () => {
    try {
      setStoryLoading(true)
      setStoryError('')

      const result = await getStory(storyId)
      const data = extractStory(result)

      if (!data || !data.id) {
        throw new Error('Story not found.')
      }

      setStory(normalizeStory(data))
    } catch (error) {
      console.error('Unable to load story:', error)
      setStory(null)

      setStoryError(
        error.response?.status === 404
          ? 'This story could not be found or is no longer published.'
          : 'Unable to load this story. Please check your internet connection.'
      )
    } finally {
      setStoryLoading(false)
    }
  }, [storyId])

  useEffect(() => {
    if (storyId) {
      loadStory()
    } else {
      setStory(null)
      setStoryLoading(false)
    }
  }, [storyId, loadStory])

  // Load chapters from API
  const loadChapters = useCallback(async () => {
    try {
      setChaptersLoading(true)

      const result = await getChapters(storyId)
      const chapterList = extractChapters(result)

      const published = chapterList
        .filter((chapter) => chapter.status !== 'draft')
        .sort((a, b) => {
          return (
            Number(a.chapter_number ?? a.chapterNumber ?? 0) -
            Number(b.chapter_number ?? b.chapterNumber ?? 0)
          )
        })

      setChapters(published)
    } catch (error) {
      console.error('Unable to load chapters:', error)
      setChapters([])
    } finally {
      setChaptersLoading(false)
    }
  }, [storyId])

  useEffect(() => {
    if (storyId) {
      loadChapters()
    } else {
      setChapters([])
      setChaptersLoading(false)
    }
  }, [storyId, loadChapters])

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      setCommentsLoading(true)

      const result = await getComments(storyId)
      setComments(extractComments(result))
    } catch (error) {
      console.error('Unable to load comments:', error)
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [storyId])

  useEffect(() => {
    if (storyId) {
      loadComments()
    }
  }, [storyId, loadComments])

  // Restore reading progress
  useEffect(() => {
    if (!chapters.length) {
      setCurrentChapterIndex(0)
      return
    }

    if (chapterId) {
      const foundIndex = chapters.findIndex(
        (chapter) => String(chapter.id) === String(chapterId)
      )

      if (foundIndex !== -1) {
        setCurrentChapterIndex(foundIndex)
        return
      }
    }

    const progressKey = `moonlit_pages_progress_${storyId}`
    const savedProgress = localStorage.getItem(progressKey)
    const savedIndex = Number(savedProgress)

    const validIndex = Math.min(
      Math.max(Number.isFinite(savedIndex) ? savedIndex : 0, 0),
      chapters.length - 1
    )

    setCurrentChapterIndex(validIndex)

    const savedChapter = chapters[validIndex]

    if (
      savedChapter &&
      String(savedChapter.id) !== String(chapterId || '')
    ) {
      navigate(`/reader/${storyId}/${savedChapter.id}`, {
        replace: true,
      })
    }
  }, [chapters, chapterId, storyId, navigate])

  // Listen for bookmark changes
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === BOOKMARKS_KEY || event.key === null) {
        setBookmarks(readList(BOOKMARKS_KEY))
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const currentChapter = chapters[currentChapterIndex] || null

  // Save reading progress
  function saveReadingProgress(index) {
    if (index < 0 || index >= chapters.length) return

    const selectedChapter = chapters[index]

    setCurrentChapterIndex(index)

    localStorage.setItem(
      `moonlit_pages_progress_${storyId}`,
      String(index)
    )

    try {
      const history = readList(HISTORY_KEY)

      const historyEntry = {
        id: String(story.id),
        title: story.title,
        cover_image: story.coverImage || '',
        chapter_id: selectedChapter.id,
        chapter_title: selectedChapter.title,
        chapter_number:
          selectedChapter.chapter_number ?? index + 1,
        last_read_at: new Date().toISOString(),
      }

      const updatedHistory = [
        historyEntry,
        ...history.filter(
          (item) => String(item.id) !== String(story.id)
        ),
      ].slice(0, 50)

      saveList(HISTORY_KEY, updatedHistory)
    } catch (error) {
      console.error('Unable to save reading history:', error)
    }

    navigate(`/reader/${storyId}/${selectedChapter.id}`)
  }

  // Bookmark status
  const isBookmarked = story
    ? bookmarks.some((item) =>
        typeof item === 'string'
          ? item === String(story.id)
          : String(item.id) === String(story.id)
      )
    : false

  // Add or remove bookmark
  function toggleBookmark() {
    if (!story) return

    try {
      const nextBookmarks = isBookmarked
        ? bookmarks.filter((item) =>
            typeof item === 'string'
              ? item !== String(story.id)
              : String(item.id) !== String(story.id)
          )
        : [...bookmarks, String(story.id)]

      saveList(BOOKMARKS_KEY, nextBookmarks)
      setBookmarks(nextBookmarks)

      setMessage(
        isBookmarked
          ? 'Removed from your library.'
          : 'Added to your library.'
      )
    } catch (error) {
      console.error(error)
      setMessage('Could not update your library.')
    }
  }

  // Add comment
  async function handleAddComment(event) {
    event.preventDefault()

    if (!currentUser) {
      alert('Please log in to comment.')
      return
    }

    if (!commentText.trim()) return

    try {
      setCommentSubmitting(true)

      const result = await addComment(storyId, commentText.trim())

      if (result.success && result.comment) {
        setComments((previous) => [
          result.comment,
          ...previous,
        ])

        setCommentText('')
      } else {
        await loadComments()
        setCommentText('')
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
      alert('Unable to add comment. Please try again.')
    } finally {
      setCommentSubmitting(false)
    }
  }

  // Edit comment
  async function handleUpdateComment(commentId) {
    if (!editingCommentText.trim()) return

    try {
      const result = await updateComment(
        commentId,
        editingCommentText.trim()
      )

      if (result.success) {
        setComments((previous) =>
          previous.map((comment) =>
            String(comment.id) === String(commentId)
              ? result.comment
              : comment
          )
        )

        setEditingCommentId(null)
        setEditingCommentText('')
      }
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert('Unable to update comment.')
    }
  }

  // Delete comment
  async function handleDeleteComment(commentId) {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const result = await deleteComment(commentId)

      if (result.success) {
        setComments((previous) =>
          previous.filter(
            (comment) => String(comment.id) !== String(commentId)
          )
        )
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Unable to delete comment.')
    }
  }

  // Submit comment report
  async function handleCommentReportSubmit(event) {
    event.preventDefault()

    if (
      !reportingCommentId ||
      !commentReportReason ||
      commentReportLoading
    ) {
      return
    }

    try {
      setCommentReportLoading(true)

      await reportComment(reportingCommentId, {
        reason: commentReportReason,
        details: commentReportDetails.trim(),
      })

      setShowCommentReportModal(false)
      setReportingCommentId(null)
      setCommentReportReason('')
      setCommentReportDetails('')

      setMessage('Thank you. Your comment report has been submitted.')
    } catch (error) {
      console.error('Comment report error:', error)

      setMessage(
        error.response?.data?.message || 'Unable to submit your report.'
      )
    } finally {
      setCommentReportLoading(false)
    }
  }

  // Comment ownership
  function isCommentOwner(comment) {
    return (
      currentUser &&
      String(comment.user_id) === String(currentUser.id)
    )
  }

  if (!storyId) {
    return (
      <div className={`mx-auto max-w-3xl py-16 text-center ${colors.page}`}>
        <div className="text-6xl">📖</div>

        <h1 className={`mt-5 text-3xl font-bold ${colors.heading}`}>
          Choose a story to read
        </h1>

        <p className={`mt-3 ${colors.muted}`}>
          Explore Moonlit Pages and find your next favourite story.
        </p>

        <Link
          to="/explore"
          className="mt-6 inline-flex rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700"
        >
          Explore Stories
        </Link>
      </div>
    )
  }

  if (storyLoading || chaptersLoading) {
    return (
      <div className={`mx-auto max-w-3xl py-16 text-center ${colors.page}`}>
        <p className={`text-lg ${colors.accent}`}>
          Loading story...
        </p>
      </div>
    )
  }

  if (storyError || !story) {
    return (
      <div className={`mx-auto max-w-3xl py-16 text-center ${colors.page}`}>
        <div className="text-6xl">🌙</div>

        <h1 className={`mt-5 text-3xl font-bold ${colors.heading}`}>
          Unable to load story
        </h1>

        <p className="mt-3 text-red-500">
          {storyError || 'Story not found.'}
        </p>

        <button
          type="button"
          onClick={() => {
            loadStory()
            loadChapters()
          }}
          className="mt-6 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white"
        >
          Try Again
        </button>

        <Link
          to="/library"
          className={`ml-3 inline-flex rounded-xl border px-6 py-3 font-semibold ${colors.secondaryButton}`}
        >
          Back to Library
        </Link>
      </div>
    )
  }

  return (
    <div className={`mx-auto w-full min-w-0 max-w-4xl space-y-6 pb-12 ${colors.page}`}>
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/explore"
          className={`text-sm font-semibold transition ${colors.link}`}
        >
          ← Back to Explore
        </Link>

        <Link
          to="/library"
          className={`text-sm font-semibold transition ${colors.link}`}
        >
          My Library →
        </Link>
      </div>

      {/* Story information */}
      <header className={`overflow-hidden rounded-3xl border ${colors.header}`}>
        <div className="relative flex min-h-64 items-center justify-center overflow-hidden bg-linear-to-br from-indigo-950 via-violet-900 to-purple-600 px-6 py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.17),transparent_55%)]" />

          {story.coverImage ? (
            <img
              src={story.coverImage}
              alt={`${story.title} cover`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="relative text-8xl drop-shadow-lg">
              {story.emoji || '📖'}
            </span>
          )}

          <span className="absolute bottom-4 right-4 rounded-full border border-white/30 bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {story.genre || 'Other'}
          </span>
        </div>

        <div className="p-5 sm:p-8">
          <p className={`text-xs font-bold tracking-[0.25em] ${colors.accent}`}>
            MOONLIT PAGES READER
          </p>

          <h1 className={`mt-3 wrap-break-word text-3xl font-bold sm:text-4xl ${colors.heading}`}>
            {story.title}
          </h1>

          <p className={`mt-3 text-sm ${colors.muted}`}>
            Written by {story.author || 'Anonymous'}
          </p>

          {story.description && (
            <p className={`mt-5 text-sm leading-7 sm:text-base ${colors.content}`}>
              {story.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleBookmark}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${colors.button}`}
            >
              {isBookmarked ? '♥ Saved to Library' : '♡ Add to Library'}
            </button>
          </div>

          {message && (
            <p aria-live="polite" className={`mt-4 text-sm font-semibold ${colors.message}`}>
              {message}
            </p>
          )}
        </div>
      </header>

      {/* Chapter content */}
      <article className={`rounded-3xl border p-5 sm:p-10 ${colors.card}`}>
        {chapters.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mb-4 text-5xl">📚</div>

            <h2 className={`text-2xl font-bold ${colors.heading}`}>
              No published chapters yet
            </h2>

            <p className={`mt-3 ${colors.muted}`}>
              The author has not published any chapters for this story.
            </p>
          </div>
        ) : currentChapter ? (
          <>
            <div className={`mb-8 border-b pb-5 ${colors.divider}`}>
              <p className={`text-xs font-bold tracking-[0.2em] ${colors.accent}`}>
                CHAPTER {currentChapter.chapter_number ?? currentChapterIndex + 1}
              </p>

              <h2 className={`mt-3 text-2xl font-bold ${colors.heading}`}>
                {currentChapter.title}
              </h2>

              <p className={`mt-2 text-sm ${colors.muted}`}>
                Chapter {currentChapterIndex + 1} of {chapters.length}
              </p>
            </div>

            <div className="mb-7">
              <div className="mb-2 flex justify-between text-xs">
                <span className={colors.muted}>Reading progress</span>

                <span className={colors.accent}>
                  {Math.round(
                    ((currentChapterIndex + 1) / chapters.length) * 100
                  )}%
                </span>
              </div>

              <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-[#493565]' : 'bg-[#E3D2C2]'}`}>
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-300"
                  style={{
                    width: `${((currentChapterIndex + 1) / chapters.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mb-8">
              <label className={`mb-2 block text-sm font-semibold ${colors.heading}`}>
                Jump to Chapter
              </label>

              <select
                value={currentChapterIndex}
                onChange={(event) =>
                  saveReadingProgress(Number(event.target.value))
                }
                className={`w-full rounded-xl border p-3 outline-none ${
                  isDark
                    ? 'border-[#493565] bg-[#10091F] text-white'
                    : 'border-[#D9C8B8] bg-white text-gray-800'
                }`}
              >
                {chapters.map((chapter, index) => (
                  <option key={chapter.id} value={index}>
                    Chapter {chapter.chapter_number ?? index + 1}: {chapter.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={`whitespace-pre-wrap wrap-break-word text-base leading-8 sm:text-lg sm:leading-9 ${colors.content}`}>
              {currentChapter.content || 'This chapter has no content.'}
            </div>

            <div className={`mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 ${colors.divider}`}>
              <button
                type="button"
                onClick={() => saveReadingProgress(currentChapterIndex - 1)}
                disabled={currentChapterIndex === 0}
                className={`rounded-xl border px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${colors.secondaryButton}`}
              >
                ← Previous Chapter
              </button>

              <button
                type="button"
                onClick={() => saveReadingProgress(currentChapterIndex + 1)}
                disabled={currentChapterIndex === chapters.length - 1}
                className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next Chapter →
              </button>
            </div>
          </>
        ) : null}
      </article>

      {/* Screenshot preference */}
      <div className={`rounded-2xl border p-5 ${colors.card}`}>
        <p className={`text-sm font-semibold ${colors.heading}`}>
          Writer's screenshot preference:{' '}
          <span className={colors.accent}>
            {story.allowScreenshots
              ? 'Screenshots allowed'
              : 'Screenshots not allowed'}
          </span>
        </p>

        <p className={`mt-2 text-sm leading-6 ${colors.muted}`}>
          This displays the writer's preference. A website cannot reliably
          prevent screenshots taken by a device or operating system.
        </p>
      </div>

      {/* Comments */}
      <section className={`rounded-3xl border p-5 sm:p-8 ${colors.card}`}>
        <h2 className={`text-2xl font-bold ${colors.heading}`}>
          Comments ({comments.length})
        </h2>

        <form onSubmit={handleAddComment} className="mt-5">
          <textarea
            value={commentText}
            onChange={(event) => setCommentText(event.target.value)}
            placeholder="Share your thoughts about this story..."
            maxLength={2000}
            rows={4}
            className={`w-full rounded-xl border p-4 outline-none ${
              isDark
                ? 'border-[#493565] bg-[#10091F] text-white placeholder:text-gray-400'
                : 'border-[#D9C8B8] bg-white text-gray-800 placeholder:text-gray-400'
            }`}
          />

          <div className="mt-3 flex justify-between gap-3">
            <span className={`text-xs ${colors.muted}`}>
              {commentText.length}/2000
            </span>

            <button
              type="submit"
              disabled={commentSubmitting || !commentText.trim()}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {commentSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>

        <div className="mt-8 space-y-5">
          {commentsLoading ? (
            <p className={colors.muted}>Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className={colors.muted}>
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-xl border p-4 ${colors.header}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className={`font-semibold ${colors.heading}`}>
                    {comment.user?.username ||
                      comment.user?.name ||
                      'Reader'}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs">
                    {isCommentOwner(comment) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(comment.id)
                            setEditingCommentText(comment.content || '')
                          }}
                          className={colors.accent}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-500"
                        >
                          Delete
                        </button>
                      </>
                    ) : currentUser ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReportingCommentId(comment.id)
                          setCommentReportReason('')
                          setCommentReportDetails('')
                          setShowCommentReportModal(true)
                        }}
                        className="text-red-400 hover:text-red-500"
                      >
                        ⚑ Report
                      </button>
                    ) : null}
                  </div>
                </div>

                {editingCommentId === comment.id ? (
                  <div className="mt-3">
                    <textarea
                      value={editingCommentText}
                      onChange={(event) =>
                        setEditingCommentText(event.target.value)
                      }
                      maxLength={2000}
                      rows={3}
                      className="w-full rounded-lg border border-violet-400 bg-transparent p-3 outline-none"
                    />

                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdateComment(comment.id)}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(null)
                          setEditingCommentText('')
                        }}
                        className={`text-sm ${colors.muted}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`mt-3 whitespace-pre-wrap text-sm leading-7 ${colors.content}`}>
                    {comment.content}
                  </p>
                )}

                <p className={`mt-3 text-xs ${colors.muted}`}>
                  {comment.created_at
                    ? new Date(comment.created_at).toLocaleString()
                    : ''}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Comment report modal */}
      {showCommentReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${colors.card}`}>
            <h2 className={`mb-2 text-xl font-bold ${colors.heading}`}>
              Report Comment
            </h2>

            <p className={`mb-5 text-sm ${colors.muted}`}>
              Why are you reporting this comment?
            </p>

            <form onSubmit={handleCommentReportSubmit}>
              <label className={`mb-2 block text-sm font-semibold ${colors.heading}`}>
                Report reason
              </label>

              <select
                value={commentReportReason}
                onChange={(event) => setCommentReportReason(event.target.value)}
                required
                className={`mb-4 w-full rounded-xl border p-3 outline-none ${
                  isDark
                    ? 'border-[#493565] bg-[#10091F] text-white'
                    : 'border-[#D9C8B8] bg-white text-gray-800'
                }`}
              >
                <option value="">Select a reason</option>
                <option value="Harassment or bullying">Harassment or bullying</option>
                <option value="Hate speech">Hate speech</option>
                <option value="Spam">Spam</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Threats or violence">Threats or violence</option>
                <option value="Other">Other</option>
              </select>

              <label className={`mb-2 block text-sm font-semibold ${colors.heading}`}>
                Additional details (optional)
              </label>

              <textarea
                value={commentReportDetails}
                onChange={(event) => setCommentReportDetails(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Explain why this comment should be reviewed..."
                className={`mb-5 w-full resize-none rounded-xl border p-3 outline-none ${
                  isDark
                    ? 'border-[#493565] bg-[#10091F] text-white placeholder:text-gray-400'
                    : 'border-[#D9C8B8] bg-white text-gray-800 placeholder:text-gray-400'
                }`}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCommentReportModal(false)}
                  disabled={commentReportLoading}
                  className={`rounded-xl border px-4 py-2 font-semibold ${colors.secondaryButton}`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!commentReportReason || commentReportLoading}
                  className="rounded-xl bg-violet-600 px-5 py-2 font-semibold text-white disabled:opacity-50"
                >
                  {commentReportLoading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
