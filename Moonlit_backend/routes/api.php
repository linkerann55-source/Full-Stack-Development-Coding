<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\ChapterController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\SocialController;

Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'Moonlit Pages API is working!',
        'backend' => 'Laravel',
    ]);
});

Route::prefix('')->group(function () {

    // Public authentication routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Protected authentication routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
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

