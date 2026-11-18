<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserBlock;
use App\Models\UserReport;
use App\Models\Follow;
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

    // Report a user
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
}