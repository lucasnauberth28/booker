<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('setup_id')->constrained('setups')->cascadeOnDelete();
            $table->string('titulo');
            $table->string('nicho');
            $table->unsignedInteger('total_paginas_desejadas');
            $table->enum('status', ['draft', 'generating', 'curating', 'ready'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
