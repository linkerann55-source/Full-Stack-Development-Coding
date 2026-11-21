<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminActivityLog extends Model
{
    protected $fillable = [
        'admin_email',
        'action',
        'description',
        'target_id',
        'target_type',
    ];

    public static function record(
        string $action,
        ?string $description = null,
        ?int $targetId = null,
        ?string $targetType = null
    ): self {
        return self::create([
            'admin_email' => config('app.admin_email'),
            'action' => $action,
            'description' => $description,
            'target_id' => $targetId,
            'target_type' => $targetType,
        ]);
    }
}