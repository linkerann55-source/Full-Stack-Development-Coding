<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Poll;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PollController extends Controller
{
    // Display all polls or filter by username
    public function index(Request $request)
    {
        $query = Poll::with([
            'user',
            'options.votes.user',
            'replies.user',
        ])->latest();

        if ($request->filled('username')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('username', $request->username);
            });
        }

        $polls = $query->get()->map(
            fn ($poll) => $this->formatPoll($poll)
        );

        return response()->json([
            'success' => true,
            'data' => $polls,
        ]);
    }

    // Create a poll
    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:250',
            'options' => 'required|array|min:2|max:6',
            'options.*' => 'required|string|max:100',
        ]);

        $poll = DB::transaction(function () use ($request, $validated) {
            $poll = Poll::create([
                'user_id' => $request->user()->id,
                'question' => $validated['question'],
            ]);

            foreach ($validated['options'] as $option) {
                $poll->options()->create([
                    'text' => $option,
                ]);
            }

            return $poll;
        });

        $poll->load(['user', 'options.votes.user', 'replies.user']);

        return response()->json([
            'success' => true,
            'message' => 'Poll created successfully.',
            'data' => $this->formatPoll($poll),
        ], 201);
    }

    // Vote or remove an existing vote
    public function vote(Request $request, $id)
    {
        $validated = $request->validate([
            'option_id' => 'required|integer|exists:poll_options,id',
        ]);

        $poll = Poll::findOrFail($id);

        $option = $poll->options()
            ->where('id', $validated['option_id'])
            ->firstOrFail();

        $userId = $request->user()->id;

        DB::transaction(function () use ($poll, $option, $userId) {
            $existingVote = $poll->options()
                ->whereHas('votes', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->with(['votes' => function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                }])
                ->get()
                ->flatMap(fn ($item) => $item->votes)
                ->first();

            if ($existingVote && $existingVote->poll_option_id === $option->id) {
                $existingVote->delete();
                return;
            }

            $poll->options()->each(function ($item) use ($userId) {
                $item->votes()->where('user_id', $userId)->delete();
            });

            $option->votes()->create([
                'user_id' => $userId,
            ]);
        });

        $poll->load(['user', 'options.votes.user', 'replies.user']);

        return response()->json([
            'success' => true,
            'message' => 'Vote updated successfully.',
            'data' => $this->formatPoll($poll),
        ]);
    }

    // Add a poll reply
    public function addReply(Request $request, $id)
    {
        $poll = Poll::findOrFail($id);

        $validated = $request->validate([
            'text' => 'required|string|max:2000',
        ]);

        $reply = $poll->replies()->create([
            'user_id' => $request->user()->id,
            'text' => $validated['text'],
        ]);

        // Notify the poll owner
        if ($poll->user_id !== $request->user()->id) {
            Notification::create([
                'user_id' => $poll->user_id,
                'actor_id' => $request->user()->id,
                'type' => 'reply',
                'story_id' => null,
                'message' => 'replied to your poll',
            ]);
        }

        $poll->load(['user', 'options.votes.user', 'replies.user']);

        return response()->json([
            'success' => true,
            'message' => 'Poll reply added successfully.',
            'data' => $this->formatPoll($poll),
        ], 201);
    }

    // Delete a poll
    public function destroy(Request $request, $id)
    {
        $poll = Poll::findOrFail($id);

        abort_unless(
            $poll->user_id === $request->user()->id,
            403,
            'You cannot delete this poll.'
        );

        $poll->delete();

        return response()->json([
            'success' => true,
            'message' => 'Poll deleted successfully.',
        ]);
    }

    // Format poll data for React
    private function formatPoll($poll)
    {
        return [
            'id' => $poll->id,
            'user_id' => $poll->user_id,
            'username' => $poll->user?->username ?? $poll->user?->name,
            'avatar' => $poll->user?->avatar ?? '',
            'question' => $poll->question,
            'createdAt' => $poll->created_at?->toISOString(),

            'options' => $poll->options->map(function ($option) {
                return [
                    'id' => $option->id,
                    'text' => $option->text,
                    'votes' => $option->votes->map(
                        fn ($vote) => $vote->user?->username ?? $vote->user?->name
                    )->values(),
                ];
            })->values(),

            'replies' => $poll->replies->map(function ($reply) {
                return [
                    'id' => $reply->id,
                    'user_id' => $reply->user_id,
                    'username' => $reply->user?->username ?? $reply->user?->name,
                    'text' => $reply->text,
                    'createdAt' => $reply->created_at?->toISOString(),
                ];
            })->values(),
        ];
    }
}
