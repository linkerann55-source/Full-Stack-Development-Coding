
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chapters', function (Blueprint $table) {
            $table->id();

            $table->foreignId('story_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedInteger('chapter_number');
            $table->string('title');
            $table->longText('content')->nullable();
            $table->enum('status', [
                'draft',
                'published'
            ])->default('draft');

            $table->timestamps();

            $table->unique(['story_id', 'chapter_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chapters');
    }
};
