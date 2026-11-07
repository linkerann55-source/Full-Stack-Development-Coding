<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\Chapter;
use Illuminate\Http\Request;

class ChapterController extends Controller
{
    // Get chapters of a published story
    public function index($storyId)
    {
        $story = Story::where('status', 'published')
            ->findOrFail($storyId);

        return response()->json([
            'success' => true,
            'chapters' => $story->chapters()
                ->where('status', 'published')
                ->get(),
        ]);
    }

    // Get chapters belonging to the author's story
    public function myChapters(Request $request, $storyId)
    {
        $story = Story::where('user_id', $request->user()->id)
            ->findOrFail($storyId);

        return response()->json([
            'success' => true,
            'chapters' => $story->chapters()->get(),
        ]);
    }

    // Add a chapter
    public function store(Request $request, $storyId)
    {
        $story = Story::where('user_id', $request->user()->id)
            ->findOrFail($storyId);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'sometimes|in:draft,published',
        ]);

        $nextNumber = ($story->chapters()->max('chapter_number') ?? 0) + 1;

        $chapter = $story->chapters()->create([
            'chapter_number' => $nextNumber,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'status' => $validated['status'] ?? 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Chapter created successfully!',
            'chapter' => $chapter,
        ], 201);
    }

    // Update a chapter
    public function update(Request $request, $chapterId)
    {
        $chapter = Chapter::whereHas('story', function ($query) use ($request) {
            $query->where('user_id', $request->user()->id);
        })->findOrFail($chapterId);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'status' => 'sometimes|in:draft,published',
        ]);

        $chapter->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Chapter updated successfully!',
            'chapter' => $chapter,
        ]);
    }

    // Delete a chapter
    public function destroy(Request $request, $chapterId)
    {
        $chapter = Chapter::whereHas('story', function ($query) use ($request) {
            $query->where('user_id', $request->user()->id);
        })->findOrFail($chapterId);

        $chapter->delete();

        return response()->json([
            'success' => true,
            'message' => 'Chapter deleted successfully!',
        ]);
    }
}
