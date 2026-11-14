<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Notification;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    // Display all conversations or filter by username
    public function index(Request $request)
    {
        $query = Conversation::with([
            'user',
            'replies.user',
        ])->latest();

        if ($request->filled('username')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', $request->username);
            });
        }

        $conversations = $query->get()->map(
            fn ($conversation) => $this->formatConversation($conversation)
        );

        return response()->json([
            'success' => true,
            'data' => $conversations,
        ]);
    }

    // Create a conversation
    public function store(Request $request)
    {
        $validated = $request->validate([
            'text' => 'required|string|max:2000',
        ]);

        $conversation = Conversation::create([
            'user_id' => $request->user()->id,
            'text' => $validated['text'],
        ]);

        $conversation->load(['user', 'replies.user']);

        return response()->json([
            'success' => true,
            'message' => 'Conversation created successfully.',
            'data' => $this->formatConversation($conversation),
        ], 201);
    }

    // Edit a conversation
    public function update(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);

        abort_unless(
            $conversation->user_id === $request->user()->id,
            403,
            'You cannot edit this conversation.'
        );

        $validated = $request->validate([
            'text' => 'required|string|max:2000',
        ]);

        $conversation->update([
            'text' => $validated['text'],
        ]);

        $conversation->load(['user', 'replies.user']);

        return response()->json([
            'success' => true,
            'message' => 'Conversation updated successfully.',
            'data' => $this->formatConversation($conversation),
        ]);
    }

    // Delete a conversation
    public function destroy(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);

        abort_unless(
            $conversation->user_id === $request->user()->id,
            403,
            'You cannot delete this conversation.'
        );

        $conversation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Conversation deleted successfully.',
        ]);
    }

    // Add a reply
    public function addReply(Request $request, $id)
    {
        $conversation = Conversation::findOrFail($id);

        $validated = $request->validate([
            'text' => 'required|string|max:2000',
        ]);

        $reply = $conversation->replies()->create([
            'user_id' => $request->user()->id,
            'text' => $validated['text'],
        ]);

        // Notify the conversation owner
        if ($conversation->user_id !== $request->user()->id) {
            Notification::create([
                'user_id' => $conversation->user_id,
                'actor_id' => $request->user()->id,
                'type' => 'reply',
                'story_id' => null,
                'message' => 'replied to your conversation',
            ]);
        }

        $conversation->load(['user', 'replies.user']);

        return response()->json([
            'success' => true,
            'message' => 'Reply added successfully.',
            'data' => $this->formatConversation($conversation),
        ], 201);
    }

    // Format conversation data for React
    private function formatConversation($conversation)
    {
        return [
            'id' => $conversation->id,
            'user_id' => $conversation->user_id,
            'username' => $conversation->user?->username ?? $conversation->user?->name,
            'avatar' => $conversation->user?->avatar ?? '',
            'text' => $conversation->text,
            'createdAt' => $conversation->created_at?->toISOString(),
            'updatedAt' => $conversation->updated_at?->toISOString(),

            'replies' => $conversation->replies->map(function ($reply) {
                return [
                    'id' => $reply->id,
                    'user_id' => $reply->user_id,
                    'username' => $reply->user?->username ?? $reply->user?->name,
                    'avatar' => $reply->user?->avatar ?? '',
                    'text' => $reply->text,
                    'createdAt' => $reply->created_at?->toISOString(),
                ];
            })->values(),
        ];
    }
}
