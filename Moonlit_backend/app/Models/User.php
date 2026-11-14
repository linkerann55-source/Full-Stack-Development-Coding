<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'bio',
        'avatar',
        'favorite_genre',
        'cover_photo',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function stories(): HasMany
    {
        return $this->hasMany(Story::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(Like::class);
    }

    public function followers(): HasMany
    {
        return $this->hasMany(Follow::class, 'following_id');
    }

    public function following(): HasMany
    {
        return $this->hasMany(Follow::class, 'follower_id');
    }

    public function conversations(): HasMany
    {
        return $this->hasMany(Conversation::class);
    }

    public function conversationReplies(): HasMany
    {
        return $this->hasMany(ConversationReply::class);
    }

    public function polls(): HasMany
    {
        return $this->hasMany(Poll::class);
    }

    public function pollReplies(): HasMany
    {
        return $this->hasMany(PollReply::class);
    }

    public function pollVotes(): HasMany
    {
        return $this->hasMany(PollVote::class);
    }
}