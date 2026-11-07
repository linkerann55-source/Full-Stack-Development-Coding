
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
public function up(): void
{
    // Add missing story columns
    if (!Schema::hasColumn('stories', 'author_name')) {
        Schema::table('stories', function (Blueprint $table) {
            $table->string('author_name')->nullable();
        });
    }

    if (!Schema::hasColumn('stories', 'published_at')) {
        Schema::table('stories', function (Blueprint $table) {
            $table->timestamp('published_at')->nullable();
        });
    }

    // Copy existing author names
    DB::table('stories')
        ->whereNull('author_name')
        ->update(['author_name' => DB::raw('author')]);

    // Allow unpublished stories
    DB::statement(
        "ALTER TABLE stories MODIFY status ENUM('draft', 'published', 'unpublished') NOT NULL DEFAULT 'draft'"
    );

    // Add missing chapter status
    if (!Schema::hasColumn('chapters', 'status')) {
        Schema::table('chapters', function (Blueprint $table) {
            $table->enum('status', ['draft', 'published'])
                ->default('draft');
        });
    }
}

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }
};
