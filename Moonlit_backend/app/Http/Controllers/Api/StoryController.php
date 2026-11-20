<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class StoryController extends Controller
{
    // Get all published stories

public function index(Request $request)
{
    $query = Story::with('user:id,name,username,avatar')
        ->withCount('chapters')
        ->where('status', 'published');

    if ($request->filled('search')) {
        $search = $request->search;

        $query->where(function ($q) use ($search) {
            $q->where('title', 'like', "%{$search}%")
                ->orWhere('author_name', 'like', "%{$search}%")
                ->orWhere('author', 'like', "%{$search}%");
        });
    }

    if ($request->filled('genre')) {
        $query->where('genre', $request->genre);
    }

    $stories = $query->latest()->get();

    return response()->json([
        'success' => true,
        'stories' => $stories,
    ]);
}


    // Get logged-in user's stories
    public function myStories(Request $request)
    {
        $stories = Story::where('user_id', $request->user()->id)
            ->with('user')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'stories' => $stories,
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

        $user = $request->user();

        $story = Story::create([
            ...$validated,
            'user_id' => $user->id,
            'author' => $user->name,
            'author_name' => $user->name,
            'status' => 'draft',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story created successfully!',
            'story' => $story,
        ], 201);
    }

// Get one story
public function show(Request $request, $id)
{
    $story = Story::with([
        'user',
        'chapters',
    ])->findOrFail($id);

    $userId = $request->user()?->id;

    if (
        $story->status !== 'published' &&
        (!$userId || $story->user_id !== $userId)
    ) {
        abort(404);
    }

    return response()->json([
        'success' => true,
        'story' => $story,
    ]);
}

    // Update a story
    public function update(Request $request, $id)
    {
        $story = Story::findOrFail($id);

        abort_unless(
            $story->user_id === $request->user()->id,
            403,
            'You are not allowed to update this story.'
        );

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
            'story' => $story->fresh(),
        ]);
    }

    // Delete a story
    public function destroy(Request $request, $id)
    {
        $story = Story::findOrFail($id);

        abort_unless(
            $story->user_id === $request->user()->id,
            403,
            'You are not allowed to delete this story.'
        );

        $story->delete();

        return response()->json([
            'success' => true,
            'message' => 'Story deleted successfully!',
        ]);
    }

    // Publish a story
    public function publish(Request $request, $id)
    {
        $story = Story::findOrFail($id);

        abort_unless(
            $story->user_id === $request->user()->id,
            403,
            'You are not allowed to publish this story.'
        );

        $story->update([
            'status' => 'published',
            'published_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story published successfully!',
            'story' => $story->fresh(),
        ]);
    }

    // Unpublish a story
    public function unpublish(Request $request, $id)
    {
        $story = Story::findOrFail($id);

        abort_unless(
            $story->user_id === $request->user()->id,
            403,
            'You are not allowed to unpublish this story.'
        );

        $story->update([
            'status' => 'unpublished',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story unpublished successfully!',
            'story' => $story->fresh(),
        ]);
    }

    // Admin: Get all stories
    public function adminIndex()
    {
        $stories = Story::with('user:id,name,username,avatar')
            ->withCount(['chapters', 'likes', 'comments'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'stories' => $stories,
        ]);
    }

    // Admin: Publish any story
    public function adminPublish($id)
    {
        $story = Story::findOrFail($id);

        $story->update([
            'status' => 'published',
            'published_at' => $story->published_at ?? now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story published successfully!',
            'story' => $story->fresh(),
        ]);
    }

    // Admin: Unpublish any story
    public function adminUnpublish($id)
    {
        $story = Story::findOrFail($id);

        $story->update([
            'status' => 'unpublished',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story unpublished successfully!',
            'story' => $story->fresh(),
        ]);
    }

    // Admin: Delete any story
    public function adminDestroy($id)
    {
        $story = Story::findOrFail($id);

        $story->delete();

        return response()->json([
            'success' => true,
            'message' => 'Story deleted successfully!',
        ]);
    }
}
