<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Image;
use App\Models\Prompt;
use App\Models\Setup;
use App\Jobs\GenerateImageFromAi;
use App\Services\BookPdfCompilerService;
use App\Services\GeminiImageService;
use App\Services\R2StorageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_and_manage_setups(): void
    {
        $response = $this->postJson('/api/setups', [
            'nome' => 'KDP Standard 8.5x11',
            'largura_polegadas' => 8.5,
            'altura_polegadas' => 11.0,
            'margem_seguranca' => 0.125,
            'inserir_paginas_em_branco_verso' => true,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['nome' => 'KDP Standard 8.5x11']);

        $this->assertDatabaseHas('setups', ['nome' => 'KDP Standard 8.5x11']);
    }

    public function test_can_create_book_and_prompts(): void
    {
        $setup = Setup::create([
            'nome' => 'Standard',
            'largura_polegadas' => 8.5,
            'altura_polegadas' => 11.0,
            'margem_seguranca' => 0.125,
            'inserir_paginas_em_branco_verso' => true,
        ]);

        $response = $this->postJson('/api/books', [
            'setup_id' => $setup->id,
            'titulo' => 'Cute Animals Coloring Book',
            'nicho' => 'Animals',
            'total_paginas_desejadas' => 4,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['titulo' => 'Cute Animals Coloring Book']);

        $bookId = $response->json('id');

        // Add prompt
        $promptResp = $this->postJson("/api/books/{$bookId}/prompts", [
            'base_prompt' => 'Cute baby elephant with balloon',
            'style_modifiers' => ['thick lines', 'pure white background'],
            'peso_distribuicao' => 1.0,
        ]);

        $promptResp->assertStatus(201);
        $this->assertDatabaseHas('prompts', ['base_prompt' => 'Cute baby elephant with balloon']);
    }

    public function test_generation_queues_jobs_and_creates_images(): void
    {
        Queue::fake();

        $setup = Setup::create([
            'nome' => 'Standard',
            'largura_polegadas' => 8.5,
            'altura_polegadas' => 11.0,
            'margem_seguranca' => 0.125,
            'inserir_paginas_em_branco_verso' => true,
        ]);

        $book = Book::create([
            'setup_id' => $setup->id,
            'titulo' => 'Mandalas Coloring',
            'nicho' => 'Mandala',
            'total_paginas_desejadas' => 3,
        ]);

        Prompt::create([
            'book_id' => $book->id,
            'base_prompt' => 'Intricate flower mandala',
            'style_modifiers' => ['thick line art'],
            'peso_distribuicao' => 1.0,
        ]);

        $response = $this->postJson("/api/books/{$book->id}/generate");
        $response->assertStatus(200)
            ->assertJson(['total_images' => 3]);

        $this->assertDatabaseCount('images', 3);
        Queue::assertPushed(GenerateImageFromAi::class, 3);
    }

    public function test_generate_image_job_processes_and_approves_image(): void
    {
        $setup = Setup::create([
            'nome' => 'Standard',
            'largura_polegadas' => 8.5,
            'altura_polegadas' => 11.0,
            'margem_seguranca' => 0.125,
            'inserir_paginas_em_branco_verso' => true,
        ]);

        $book = Book::create([
            'setup_id' => $setup->id,
            'titulo' => 'Mandalas Coloring',
            'nicho' => 'Mandala',
            'total_paginas_desejadas' => 1,
        ]);

        $prompt = Prompt::create([
            'book_id' => $book->id,
            'base_prompt' => 'Cute cat in garden',
            'peso_distribuicao' => 1.0,
        ]);

        $image = Image::create([
            'book_id' => $book->id,
            'prompt_id' => $prompt->id,
            'status' => 'queued',
            'page_order' => 0,
        ]);

        $job = new GenerateImageFromAi($image);
        $job->handle(app(GeminiImageService::class), app(R2StorageService::class));

        $image->refresh();
        $this->assertEquals('approved', $image->status);
        $this->assertNotNull($image->r2_file_url);

        $book->refresh();
        $this->assertEquals('curating', $book->status);
    }

    public function test_curation_and_pdf_compilation(): void
    {
        $setup = Setup::create([
            'nome' => 'Standard KDP',
            'largura_polegadas' => 8.5,
            'altura_polegadas' => 11.0,
            'margem_seguranca' => 0.125,
            'inserir_paginas_em_branco_verso' => true,
        ]);

        $book = Book::create([
            'setup_id' => $setup->id,
            'titulo' => 'Complete KDP Book',
            'nicho' => 'Coloring',
            'total_paginas_desejadas' => 2,
        ]);

        $prompt = Prompt::create([
            'book_id' => $book->id,
            'base_prompt' => 'Coloring pattern',
            'peso_distribuicao' => 1.0,
        ]);

        // Create approved images
        $gemini = app(GeminiImageService::class);
        $r2 = app(R2StorageService::class);
        
        $imgData1 = $gemini->generateImage('Pattern 1');
        $url1 = $r2->uploadImage($imgData1['image_data'], "books/{$book->id}/images/1.png");
        
        $img1 = Image::create([
            'book_id' => $book->id,
            'prompt_id' => $prompt->id,
            'status' => 'approved',
            'r2_file_url' => $url1,
            'page_order' => 0,
        ]);

        // Toggle status test
        $this->patchJson("/api/images/{$img1->id}/status", ['status' => 'approved'])
            ->assertStatus(200);

        // Compile PDF
        $compResp = $this->postJson("/api/books/{$book->id}/compile");
        $compResp->assertStatus(200)
            ->assertJsonStructure(['message', 'pdf_url', 'url']);

        $book->refresh();
        $this->assertEquals('ready', $book->status);
    }
}

