<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\ChapterController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\SocialController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ConversationController;
use App\Http\Controllers\Api\PollController;
use App\Http\Controllers\Api\UserSafetyController;

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'Moonlit Pages API is working!',
        'backend' => 'Laravel',
    ]);
});

Route::get('/users/search', [ProfileController::class, 'search']);

Route::get('/users/username/{username}', [
    ProfileController::class,
    'publicShow'
]);

Route::prefix('')->group(function () {

    // Public authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    // Protected authentication routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/photos', [ProfileController::class, 'uploadPhotos']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
        Route::delete('/notifications', [NotificationController::class, 'clearAll']);

        // Block and Report routes
        Route::post('/users/{userId}/block', [UserSafetyController::class, 'block']);

        Route::delete('/users/{userId}/block', [UserSafetyController::class, 'unblock']);

        Route::get('/users/{userId}/block-status', [UserSafetyController::class, 'blockStatus']);

        Route::post('/users/{userId}/report', [UserSafetyController::class, 'report']);
    });

});

// Public story routes
Route::get('/stories', [StoryController::class, 'index']);
Route::get('/stories/{storyId}', [StoryController::class, 'show']);

// Public comment route
Route::get('/stories/{storyId}/comments', [CommentController::class, 'index']);

// Public social routes
Route::get('/users/{userId}/followers', [SocialController::class, 'followers']);

Route::get('/users/{userId}/following', [SocialController::class, 'following']);

// Protected story routes
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/my-stories', [StoryController::class, 'myStories']);

    Route::post('/stories', [StoryController::class, 'store']);

    Route::put('/stories/{storyId}', [StoryController::class, 'update']);

    Route::delete('/stories/{storyId}', [StoryController::class, 'destroy']);

    Route::post('/stories/{storyId}/publish', [StoryController::class, 'publish']);

    Route::post('/stories/{storyId}/unpublish', [StoryController::class, 'unpublish']);

        // Chapter management
    Route::get('/stories/{storyId}/chapters', [ChapterController::class, 'index']);
    Route::get('/my-stories/{storyId}/chapters', [ChapterController::class, 'myChapters']);

    Route::post('/stories/{storyId}/chapters', [ChapterController::class, 'store']);

    Route::put('/chapters/{chapterId}', [ChapterController::class, 'update']);

    Route::delete('/chapters/{chapterId}', [ChapterController::class, 'destroy']);

    // Protected comment routes
    Route::post('/stories/{storyId}/comments', [CommentController::class, 'store']);

    Route::put('/comments/{commentId}', [CommentController::class, 'update']);

    Route::delete('/comments/{commentId}', [CommentController::class, 'destroy']);

        // Protected social routes
    Route::post('/stories/{storyId}/like', [SocialController::class, 'like']);

    Route::delete('/stories/{storyId}/like', [SocialController::class, 'unlike']);

    Route::get('/stories/{storyId}/check-like', [SocialController::class, 'checkLike']);

    Route::post('/users/{userId}/follow', [SocialController::class, 'follow']);

    Route::delete('/users/{userId}/follow', [SocialController::class, 'unfollow']);

    Route::get('/users/{userId}/check-follow', [SocialController::class, 'checkFollow']);
});

// Public conversation routes
Route::get('/conversations', [ConversationController::class, 'index']);

// Public poll routes
Route::get('/polls', [PollController::class, 'index']);

// Protected conversation and poll routes
Route::middleware('auth:sanctum')->group(function () {

    // Conversations
    Route::post('/conversations', [ConversationController::class, 'store']);
    Route::put('/conversations/{id}', [ConversationController::class, 'update']);
    Route::delete('/conversations/{id}', [ConversationController::class, 'destroy']);
    Route::post('/conversations/{id}/replies', [ConversationController::class, 'addReply']);

    // Polls
    Route::post('/polls', [PollController::class, 'store']);
    Route::post('/polls/{id}/vote', [PollController::class, 'vote']);
    Route::post('/polls/{id}/replies', [PollController::class, 'addReply']);
    Route::delete('/polls/{id}', [PollController::class, 'destroy']);
});

// Admin protected routes
Route::prefix('admin')->middleware('admin.auth')->group(function () {

    Route::get('/dashboard', function () {
        return response()->json([
            'success' => true,
            'message' => 'Admin access granted!',
        ]);
    });

});