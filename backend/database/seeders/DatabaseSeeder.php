<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Standard KDP Setups
        $setupStandard = \App\Models\Setup::create([
            'nome' => 'KDP Padrão (8.5" x 11")',
            'largura_polegadas' => 8.50,
            'altura_polegadas' => 11.00,
            'margem_seguranca' => 0.125,
            'inserir_paginas_em_branco_verso' => true,
        ]);

        \App\Models\Setup::create([
            'nome' => 'KDP Quadrado (8.5" x 8.5")',
            'largura_polegadas' => 8.50,
            'altura_polegadas' => 8.50,
            'margem_seguranca' => 0.125,
            'inserir_paginas_em_branco_verso' => true,
        ]);

        \App\Models\Setup::create([
            'nome' => 'KDP Pocket (6" x 9")',
            'largura_polegadas' => 6.00,
            'altura_polegadas' => 9.00,
            'margem_seguranca' => 0.125,
            'inserir_paginas_em_branco_verso' => false,
        ]);

        // 2. Sample Book Project
        $book = \App\Models\Book::create([
            'setup_id' => $setupStandard->id,
            'titulo' => 'Mandalas Místicas & Animais da Floresta',
            'nicho' => 'Adult Coloring / Mindfulness',
            'total_paginas_desejadas' => 10,
            'status' => 'draft',
        ]);

        // 3. Sample Prompts
        \App\Models\Prompt::create([
            'book_id' => $book->id,
            'base_prompt' => 'Detailed mandala with a majestic wolf face in the center, symmetrical floral patterns, intricate line art',
            'style_modifiers' => ['thick black outlines', 'pure white background', 'coloring book style', 'high resolution'],
            'peso_distribuicao' => 0.50,
        ]);

        \App\Models\Prompt::create([
            'book_id' => $book->id,
            'base_prompt' => 'Whimsical owl perched on ornate branches surrounded by geometric mandala shapes',
            'style_modifiers' => ['clean line art', 'no shading', 'vector style', 'amazon kdp ready'],
            'peso_distribuicao' => 0.50,
        ]);
    }
}
