<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chapter extends Model
{
    protected $fillable = [
        'story_id',
        'chapter_number',
        'title',
        'content',
        'status',
    ];

    public function story(): BelongsTo
    {
        return $this->belongsTo(Story::class);
    }
}
