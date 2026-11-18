<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\User;
use App\Models\Like;
use App\Models\Follow;
use App\Models\Notification;
use App\Models\UserBlock;
use Illuminate\Http\Request;

class SocialController extends Controller
{
    // Check whether either user has blocked the other
    private function isBlocked(int $userId, int $otherUserId): bool
    {
        return UserBlock::where(function ($query) use ($userId, $otherUserId) {
            $query->where('blocker_id', $userId)
                ->where('blocked_id', $otherUserId);
        })->orWhere(function ($query) use ($userId, $otherUserId) {
            $query->where('blocker_id', $otherUserId)
                ->where('blocked_id', $userId);
        })->exists();
    }

    // Like a story
    public function like(Request $request, $storyId)
    {
        $story = Story::where('status', 'published')
            ->findOrFail($storyId);

        if ($this->isBlocked($request->user()->id, $story->user_id)) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot interact with this user.',
            ], 403);
        }

        $like = Like::firstOrCreate([
            'story_id' => $story->id,
            'user_id' => $request->user()->id,
        ]);

        if (
            $like->wasRecentlyCreated &&
            $story->user_id !== $request->user()->id
        ) {
            Notification::create([
                'user_id' => $story->user_id,
                'actor_id' => $request->user()->id,
                'type' => 'like',
                'story_id' => $story->id,
                'message' => 'liked your story',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Story liked successfully!',
            'likes_count' => $story->likes()->count(),
        ]);
    }

    // Unlike a story
    public function unlike(Request $request, $storyId)
    {
        $story = Story::where('status', 'published')
            ->findOrFail($storyId);

        Like::where('story_id', $story->id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Story unliked successfully!',
            'likes_count' => $story->likes()->count(),
        ]);
    }

    // Follow a user
    public function follow(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot follow yourself.',
            ], 422);
        }

        if ($this->isBlocked($request->user()->id, $user->id)) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot follow this user.',
            ], 403);
        }

        $follow = Follow::firstOrCreate([
            'follower_id' => $request->user()->id,
            'following_id' => $user->id,
        ]);

        if ($follow->wasRecentlyCreated) {
            Notification::create([
                'user_id' => $user->id,
                'actor_id' => $request->user()->id,
                'type' => 'follow',
                'story_id' => null,
                'message' => 'started following you',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'User followed successfully!',
            'followers_count' => $user->followers()->count(),
        ]);
    }

    // Unfollow a user
    public function unfollow(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        Follow::where('follower_id', $request->user()->id)
            ->where('following_id', $user->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'User unfollowed successfully!',
            'followers_count' => $user->followers()->count(),
        ]);
    }

    // Get followers
    public function followers($userId)
    {
        $user = User::findOrFail($userId);

        $followers = $user->followers()
            ->with('follower:id,name,username,avatar')
            ->latest()
            ->get()
            ->pluck('follower');

        return response()->json([
            'success' => true,
            'followers' => $followers,
        ]);
    }

    // Get following
    public function following($userId)
    {
        $user = User::findOrFail($userId);

        $following = $user->following()
            ->with('following:id,name,username,avatar')
            ->latest()
            ->get()
            ->pluck('following');

        return response()->json([
            'success' => true,
            'following' => $following,
        ]);
    }

    // Check whether the logged-in user likes a story
    public function checkLike(Request $request, $storyId)
    {
        $liked = Like::where('story_id', $storyId)
            ->where('user_id', $request->user()->id)
            ->exists();

        return response()->json([
            'success' => true,
            'liked' => $liked,
        ]);
    }

    // Check whether the logged-in user follows a user
    public function checkFollow(Request $request, $userId)
    {
        $isBlocked = $this->isBlocked(
            $request->user()->id,
            (int) $userId
        );

        $following = false;

        if (!$isBlocked) {
            $following = Follow::where(
                'follower_id',
                $request->user()->id
            )->where('following_id', $userId)->exists();
        }

        return response()->json([
            'success' => true,
            'following' => $following,
            'blocked' => $isBlocked,
        ]);
    }
}
