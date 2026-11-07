<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use Illuminate\Http\Request;

class StoryController extends Controller
{
    // Get all published stories
    public function index(Request $request)
    {
        $stories = Story::with('user:id,name,username')
            ->withCount(['chapters', 'likes', 'comments'])
            ->where('status', 'published')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('author_name', 'like', "%{$search}%");
                });
            })
            ->when($request->genre, function ($query, $genre) {
                $query->where('genre', $genre);
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'stories' => $stories,
        ]);
    }

    // Get one published story
    public function show($storyId)
    {
        $story = Story::with([
            'user:id,name,username',
            'chapters'
        ])
        ->withCount(['likes', 'comments'])
        ->where('status', 'published')
        ->findOrFail($storyId);

        return response()->json([
            'success' => true,
            'story' => $story,
        ]);
    }

    // Create a new story
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|string',
            'genre' => 'nullable|string|max:100',
        ]);

        $story = Story::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'author_name' => $request->user()->name,
            'status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story created successfully!',
            'story' => $story,
        ], 201);
    }

    // Get the logged-in user's stories
    public function myStories(Request $request)
    {
        $stories = Story::withCount(['chapters', 'likes', 'comments'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'stories' => $stories,
        ]);
    }

    // Update a story
    public function update(Request $request, $storyId)
    {
        $story = Story::where('user_id', $request->user()->id)
            ->findOrFail($storyId);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|string',
            'genre' => 'nullable|string|max:100',
        ]);

        $story->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Story updated successfully!',
            'story' => $story,
        ]);
    }

    // Publish a story
    public function publish(Request $request, $storyId)
    {
        $story = Story::where('user_id', $request->user()->id)
            ->withCount('chapters')
            ->findOrFail($storyId);

        if ($story->chapters_count === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Add at least one chapter before publishing.',
            ], 422);
        }

        $story->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story published successfully!',
            'story' => $story,
        ]);
    }

    // Unpublish a story
    public function unpublish(Request $request, $storyId)
    {
        $story = Story::where('user_id', $request->user()->id)
            ->findOrFail($storyId);

        $story->update([
            'status' => 'unpublished',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story unpublished successfully!',
            'story' => $story,
        ]);
    }

    // Delete a story
    public function destroy(Request $request, $storyId)
    {
        $story = Story::where('user_id', $request->user()->id)
            ->findOrFail($storyId);

        $story->delete();

        return response()->json([
            'success' => true,
            'message' => 'Story deleted successfully!',
        ]);
    }
}
