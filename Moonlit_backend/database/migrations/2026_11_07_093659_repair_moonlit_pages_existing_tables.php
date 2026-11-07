<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'username')) {
                $table->string('username', 50)->nullable()->unique();
            }
        });

        // Update stories table
        Schema::table('stories', function (Blueprint $table) {
            if (!Schema::hasColumn('stories', 'author_name')) {
                $table->string('author_name')->nullable();
            }

            if (!Schema::hasColumn('stories', 'published_at')) {
                $table->timestamp('published_at')->nullable();
            }
        });

        // Update chapters table
        Schema::table('chapters', function (Blueprint $table) {
            if (!Schema::hasColumn('chapters', 'status')) {
                $table->enum('status', ['draft', 'published'])
                    ->default('draft');
            }
        });
    }

    public function down(): void
    {
        // Keep existing user and story data.
    }
};