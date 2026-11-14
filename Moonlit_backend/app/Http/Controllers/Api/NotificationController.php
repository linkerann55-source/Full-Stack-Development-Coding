<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NotificationController extends Controller
{
    // Get logged-in user's notifications
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->with([
                'actor:id,name,username,avatar',
                'story:id,title',
            ])
            ->latest()
            ->get()
            ->map(function ($notification) {
                $actor = $notification->actor;
                $story = $notification->story;

                return [
                    'id' => (string) $notification->id,
                    'type' => $notification->type,
                    'username' => $actor?->username ?: ($actor?->name ?? 'Moonlit Pages'),
                    'avatar' => $actor?->avatar
                        ? (str_starts_with($actor->avatar, 'http')
                            ? $actor->avatar
                            : url(Storage::url($actor->avatar)))
                        : null,
                    'message' => $notification->message,
                    'target' => $story?->title ?? '',
                    'storyId' => $notification->story_id
                        ? (string) $notification->story_id
                        : '',
                    'profileUsername' => $actor?->username ?: ($actor?->name ?? ''),
                    'time' => $notification->created_at?->diffForHumans() ?? 'Recently',
                    'read' => $notification->read_at !== null,
                ];
            });

        return response()->json([
            'success' => true,
            'notifications' => $notifications,
        ]);
    }

    // Mark one notification as read
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update([
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    // Mark all notifications as read
    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }

    // Delete one notification
    public function destroy(Request $request, $id)
    {
        Notification::where('user_id', $request->user()->id)
            ->findOrFail($id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted.',
        ]);
    }

    // Clear all notifications
    public function clearAll(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'All notifications cleared.',
        ]);
    }
}
