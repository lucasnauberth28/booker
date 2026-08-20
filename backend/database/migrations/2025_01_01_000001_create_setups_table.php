<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('setups', function (Blueprint $table) {
            $table->id();
            $table->string('nome');
            $table->decimal('largura_polegadas', 5, 2);
            $table->decimal('altura_polegadas', 5, 2);
            $table->decimal('margem_seguranca', 5, 3)->default(0.125);
            $table->boolean('inserir_paginas_em_branco_verso')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('setups');
    }
};
