<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\Comment;
use App\Models\Notification;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    // Get comments for a story
    public function index($storyId)
    {
        $story = Story::where('status', 'published')
            ->findOrFail($storyId);

        $comments = $story->comments()
            ->with('user:id,name,username,avatar')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'comments' => $comments,
        ]);
    }

    // Add a comment
    public function store(Request $request, $storyId)
    {
        $story = Story::where('status', 'published')
            ->findOrFail($storyId);

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment = $story->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $validated['content'],
        ]);

        $comment->load('user:id,name,username,avatar');

        // Notify the story owner about the new comment
        if ($story->user_id !== $request->user()->id) {
            Notification::create([
                'user_id' => $story->user_id,
                'actor_id' => $request->user()->id,
                'type' => 'comment',
                'story_id' => $story->id,
                'message' => 'commented on your story',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully!',
            'comment' => $comment,
        ], 201);
    }

    // Edit own comment
    public function update(Request $request, $commentId)
    {
        $comment = Comment::where('user_id', $request->user()->id)
            ->findOrFail($commentId);

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Comment updated successfully!',
            'comment' => $comment,
        ]);
    }

    // Delete own comment
    public function destroy(Request $request, $commentId)
    {
        $comment = Comment::where('user_id', $request->user()->id)
            ->findOrFail($commentId);

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully!',
        ]);
    }
}
