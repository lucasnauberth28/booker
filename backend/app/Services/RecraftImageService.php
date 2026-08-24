<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecraftImageService
{
    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.recraft.api_key', env('RECRAFT_API_KEY', ''));
        $this->model = config('services.recraft.model', 'recraftv3');
    }

    /**
     * Generates a pure vector line art coloring page using Recraft v3
     */
    public function generateImage(string $prompt, array $styleModifiers = [], ?int $bookId = null): array
    {
        $recraftPrompt = "Children coloring book page, {$prompt}, clean thick black outlines on pure white paper, uncolored, no colors, no shading, no fills";

        if (!empty($this->apiKey) && !str_starts_with($this->apiKey, 'your-')) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])->timeout(60)->post('https://external.api.recraft.ai/v1/images/generations', [
                    'prompt' => $recraftPrompt,
                    'style' => 'vector_illustration/line_art',
                    'model' => $this->model,
                    'size' => '1024x1024',
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $imageUrl = $data['data'][0]['url'] ?? null;

                    if ($imageUrl) {
                        $imageBinary = Http::timeout(30)->get($imageUrl)->body();
                        $framed = $this->processKdpColoringPage($imageBinary);

                        \App\Models\TokenUsage::create([
                            'book_id' => $bookId,
                            'model' => 'recraft-v3-vector-lineart',
                            'operation_type' => 'image_generation',
                            'prompt_tokens' => max(20, (int)(strlen($recraftPrompt) / 4)),
                            'candidates_tokens' => 1024,
                            'total_tokens' => max(20, (int)(strlen($recraftPrompt) / 4)) + 1024,
                            'estimated_cost_usd' => 0.040,
                            'metadata' => [
                                'engine' => 'recraft-vector-lineart',
                                'prompt' => $prompt,
                            ],
                        ]);

                        return [
                            'success' => true,
                            'image_data' => base64_encode($framed),
                            'mime_type' => 'image/png',
                        ];
                    }
                } else {
                    Log::error('Recraft API error: ' . $response->body());
                }
            } catch (\Exception $e) {
                Log::error('Recraft API exception: ' . $e->getMessage());
            }
        }

        // Fallback to GeminiImageService if Recraft is not yet keyed or fails
        $geminiService = app(GeminiImageService::class);
        return $geminiService->generateImage($prompt, $styleModifiers, $bookId);
    }

    /**
     * Generates a vibrant cover illustration using Recraft v3
     */
    public function generateCover(\App\Models\Book $book): array
    {
        $coverPrompt = "Vibrant award-winning children book cover illustration, '{$book->titulo}', {$book->nicho}, colorful, whimsical, cute friendly animals, professional book cover art, no text";

        if (!empty($this->apiKey) && !str_starts_with($this->apiKey, 'your-')) {
            try {
                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])->timeout(60)->post('https://external.api.recraft.ai/v1/images/generations', [
                    'prompt' => $coverPrompt,
                    'style' => 'digital_illustration',
                    'model' => $this->model,
                    'size' => '1024x1024',
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $imageUrl = $data['data'][0]['url'] ?? null;

                    if ($imageUrl) {
                        $imageBinary = Http::timeout(30)->get($imageUrl)->body();
                        $r2Service = app(R2StorageService::class);
                        $coverPath = "books/{$book->id}/cover_" . time() . ".png";
                        $coverUrl = $r2Service->uploadImage(base64_encode($imageBinary), $coverPath);

                        $book->update(['cover_image_url' => $coverUrl]);

                        return [
                            'success' => true,
                            'cover_url' => $coverUrl,
                        ];
                    }
                }
            } catch (\Exception $e) {
                Log::error('Recraft Cover generation exception: ' . $e->getMessage());
            }
        }

        $geminiService = app(GeminiImageService::class);
        return $geminiService->generateCover($book);
    }

    /**
     * Post-processes coloring page: scales inside KDP margins and draws neat outer frame
     */
    protected function processKdpColoringPage(string $rawBinary): string
    {
        $src = @imagecreatefromstring($rawBinary);
        if (!$src) {
            return $rawBinary;
        }

        $origW = imagesx($src);
        $origH = imagesy($src);

        $targetW = 1024;
        $targetH = 1024;

        $canvas = imagecreatetruecolor($targetW, $targetH);
        $white = imagecolorallocate($canvas, 255, 255, 255);
        $black = imagecolorallocate($canvas, 0, 0, 0);
        imagefill($canvas, 0, 0, $white);

        $margin = 50;
        $innerW = $targetW - ($margin * 2);
        $innerH = $targetH - ($margin * 2);
        imagecopyresampled($canvas, $src, $margin, $margin, 0, 0, $innerW, $innerH, $origW, $origH);
        imagedestroy($src);

        // Draw Amazon KDP clean outer rectangular border
        imagesetthickness($canvas, 6);
        imagerectangle($canvas, 35, 35, $targetW - 35, $targetH - 35, $black);

        ob_start();
        imagepng($canvas);
        $processed = ob_get_clean();
        imagedestroy($canvas);

        return $processed;
    }
}
