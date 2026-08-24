<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('token_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->string('model')->default('imagen-3.0-generate-002');
            $table->string('operation_type')->default('image_generation');
            $table->integer('prompt_tokens')->default(0);
            $table->integer('candidates_tokens')->default(0);
            $table->integer('total_tokens')->default(0);
            $table->decimal('estimated_cost_usd', 8, 5)->default(0.00000);
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('token_usages');
    }
};
