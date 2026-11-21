<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserBlock;
use App\Models\UserReport;
use App\Models\Follow;
use App\Models\Story;
use App\Models\Comment;
use Illuminate\Http\Request;

class UserSafetyController extends Controller
{
    // Block a user
    public function block(Request $request, $userId)
    {
        $currentUser = $request->user();
        $targetUser = User::findOrFail($userId);

        if ($currentUser->id === $targetUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot block yourself.',
            ], 422);
        }

        UserBlock::firstOrCreate([
            'blocker_id' => $currentUser->id,
            'blocked_id' => $targetUser->id,
        ]);

        // Remove follows in both directions
        Follow::where(function ($query) use ($currentUser, $targetUser) {
            $query->where('follower_id', $currentUser->id)
                ->where('following_id', $targetUser->id);
        })->orWhere(function ($query) use ($currentUser, $targetUser) {
            $query->where('follower_id', $targetUser->id)
                ->where('following_id', $currentUser->id);
        })->delete();

        return response()->json([
            'success' => true,
            'message' => 'User blocked successfully.',
        ]);
    }

    // Unblock a user
    public function unblock(Request $request, $userId)
    {
        User::findOrFail($userId);

        UserBlock::where('blocker_id', $request->user()->id)
            ->where('blocked_id', $userId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'User unblocked successfully.',
        ]);
    }

    // Check block status between two users
    public function blockStatus(Request $request, $userId)
    {
        User::findOrFail($userId);

        $currentUserId = $request->user()->id;

        $blockedByMe = UserBlock::where('blocker_id', $currentUserId)
            ->where('blocked_id', $userId)
            ->exists();

        $blockedMe = UserBlock::where('blocker_id', $userId)
            ->where('blocked_id', $currentUserId)
            ->exists();

        return response()->json([
            'success' => true,
            'blocked_by_me' => $blockedByMe,
            'blocked_me' => $blockedMe,
        ]);
    }

    // Report a user profile
    public function report(Request $request, $userId)
    {
        $currentUser = $request->user();
        $targetUser = User::findOrFail($userId);

        if ($currentUser->id === $targetUser->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot report yourself.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:100',
            'details' => 'nullable|string|max:2000',
        ]);

        $report = UserReport::create([
            'reporter_id' => $currentUser->id,
            'reported_user_id' => $targetUser->id,
            'report_type' => 'profile',
            'reason' => $validated['reason'],
            'details' => $validated['details'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Report submitted successfully.',
            'report_id' => $report->id,
        ], 201);
    }

    // Report a story
    public function reportStory(Request $request, $storyId)
    {
        $currentUser = $request->user();
        $story = Story::findOrFail($storyId);

        if ($currentUser->id === $story->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot report your own story.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:100',
            'details' => 'nullable|string|max:2000',
        ]);

        $report = UserReport::create([
            'reporter_id' => $currentUser->id,
            'reported_user_id' => $story->user_id,
            'report_type' => 'story',
            'story_id' => $story->id,
            'reason' => $validated['reason'],
            'details' => $validated['details'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Story report submitted successfully.',
            'report_id' => $report->id,
        ], 201);
    }

    // Report a comment
    public function reportComment(Request $request, $commentId)
    {
        $currentUser = $request->user();
        $comment = Comment::with('user')->findOrFail($commentId);

        if ($currentUser->id === $comment->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot report your own comment.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:100',
            'details' => 'nullable|string|max:2000',
        ]);

        $report = UserReport::create([
            'reporter_id' => $currentUser->id,
            'reported_user_id' => $comment->user_id,
            'report_type' => 'comment',
            'comment_id' => $comment->id,
            'reason' => $validated['reason'],
            'details' => $validated['details'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Comment report submitted successfully.',
            'report_id' => $report->id,
        ], 201);
    }
}
