<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PollReply extends Model
{
    protected $fillable = [
        'poll_id',
        'user_id',
        'text',
    ];

    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}