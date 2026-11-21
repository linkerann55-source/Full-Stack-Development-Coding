<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_reports', function (Blueprint $table) {
            $table->string('report_type')->default('profile')->after('reported_user_id');

            $table->foreignId('story_id')
                ->nullable()
                ->after('report_type')
                ->constrained('stories')
                ->nullOnDelete();

            $table->foreignId('comment_id')
                ->nullable()
                ->after('story_id')
                ->constrained('comments')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('comment_id');
            $table->dropConstrainedForeignId('story_id');
            $table->dropColumn('report_type');
        });
    }
};