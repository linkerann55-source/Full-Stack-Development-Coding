<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\User;
use App\Models\Like;
use App\Models\Follow;
use App\Models\Notification;
use Illuminate\Http\Request;

class SocialController extends Controller
{
    public function like(Request $request, $storyId)
    {
        $story = Story::where('status', 'published')
            ->findOrFail($storyId);

        $like = Like::firstOrCreate([
            'story_id' => $story->id,
            'user_id' => $request->user()->id,
        ]);

        // Notify the story owner only when a new like is created
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

    public function follow(Request $request, $userId)
    {
        $user = User::findOrFail($userId);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot follow yourself.',
            ], 422);
        }

        $follow = Follow::firstOrCreate([
            'follower_id' => $request->user()->id,
            'following_id' => $user->id,
        ]);

        // Notify only when a new follow is created
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
