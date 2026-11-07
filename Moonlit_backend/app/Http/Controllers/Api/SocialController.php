<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\User;
use App\Models\Like;
use App\Models\Follow;
use Illuminate\Http\Request;

class SocialController extends Controller
{
    // Like a story
    public function like(Request $request, $storyId)
    {
        $story = Story::where('status', 'published')
            ->findOrFail($storyId);

        Like::firstOrCreate([
            'story_id' => $story->id,
            'user_id' => $request->user()->id,
        ]);

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

    // Follow an author
    public function follow(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot follow yourself.',
            ], 422);
        }

        Follow::firstOrCreate([
            'follower_id' => $request->user()->id,
            'following_id' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User followed successfully!',
            'followers_count' => $user->followers()->count(),
        ]);
    }

    // Unfollow an author
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

    // Get an author's followers
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

    // Get an author's following list
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

    // Check whether the logged-in user follows an author
    public function checkFollow(Request $request, $userId)
    {
        $following = Follow::where(
            'follower_id',
            $request->user()->id
        )->where('following_id', $userId)->exists();

        return response()->json([
            'success' => true,
            'following' => $following,
        ]);
    }
}
