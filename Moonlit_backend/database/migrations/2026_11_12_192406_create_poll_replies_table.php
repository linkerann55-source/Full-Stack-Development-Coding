<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('poll_replies')) {
            Schema::create('poll_replies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('poll_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->text('text');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('poll_replies');
    }
};