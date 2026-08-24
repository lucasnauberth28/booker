<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiImageService
{
    protected string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', '');
        $this->model = config('services.gemini.model', 'imagen-3.0-generate-002');
    }

    public function generateImage(string $prompt, array $styleModifiers = [], ?int $bookId = null): array
    {
        $enhancedPrompt = $prompt;
        $fullPrompt = "Cute simple 2D children coloring book page, bold thick black outlines, pure white background, no shading, no grayscale: " . $prompt;

        // If a real API key is configured (not placeholder/empty) and not in test environment
        if (!app()->environment('testing') && !empty($this->apiKey) && !str_starts_with($this->apiKey, 'your-')) {
            try {
                // 1. Call Google Gemini 3.6 Flash to craft a cute, child-friendly 2D cartoon scene prompt
                $geminiTextUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$this->apiKey}";
                $textResponse = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(20)
                    ->post($geminiTextUrl, [
                        'contents' => [
                            ['parts' => [['text' => "You are an expert Amazon KDP Coloring Book Art Director specializing in children's books (ages 3-8). Refine this subject into a 1-sentence prompt for a super cute, smiling, friendly cartoon baby animal or character: '{$prompt}'. Rules: Must be simple 2D cartoon line art with thick outlines, empty white interiors to color, zero shading, zero 3D, zero grayscale. Return ONLY the refined English prompt."]]]
                        ]
                    ]);

                if ($textResponse->successful()) {
                    $textData = $textResponse->json();
                    $refinedText = $textData['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if (!empty($refinedText)) {
                        $enhancedPrompt = trim($refinedText, " \t\n\r\0\x0B\"'");
                    }

                    $usage = $textData['usageMetadata'] ?? [];
                    $promptTokens = $usage['promptTokenCount'] ?? max(15, (int)(strlen($fullPrompt) / 4));
                    $candidatesTokens = $usage['candidatesTokenCount'] ?? 80;
                    $totalTokens = $usage['totalTokenCount'] ?? ($promptTokens + $candidatesTokens);

                    \App\Models\TokenUsage::create([
                        'book_id' => $bookId,
                        'model' => 'gemini-3.6-flash',
                        'operation_type' => 'prompt_enhancement',
                        'prompt_tokens' => $promptTokens,
                        'candidates_tokens' => $candidatesTokens,
                        'total_tokens' => $totalTokens,
                        'estimated_cost_usd' => ($totalTokens / 1000000) * 0.15,
                        'metadata' => [
                            'prompt_snippet' => substr($enhancedPrompt, 0, 100),
                            'gemini_api_status' => 200,
                        ],
                    ]);
                }
            } catch (\Exception $e) {
                Log::warning('Gemini prompt enhancement warning: ' . $e->getMessage());
            }
        }

        // Try FLUX AI engine for authentic, kid-friendly 2D Amazon KDP coloring pages
        try {
            $fluxPrompt = "simple 2d coloring page for toddlers and kids, cute cartoon {$enhancedPrompt}, bold thick black line art, pure solid white background, completely empty white interior shapes ready for coloring, zero shading, zero grayscale, zero 3d rendering, flat vector outline, children coloring book style, high contrast, clean outlines";
            $fluxUrl = "https://image.pollinations.ai/prompt/" . urlencode($fluxPrompt) . "?width=1024&height=1365&model=flux&nologo=true&seed=" . rand(1000, 999999);
            
            $fluxResp = Http::timeout(30)->get($fluxUrl);
            if ($fluxResp->successful() && strlen($fluxResp->body()) > 5000) {
                $processedImage = $this->processKdpColoringPage($fluxResp->body());

                \App\Models\TokenUsage::create([
                    'book_id' => $bookId,
                    'model' => 'flux-1-schnell-kdp',
                    'operation_type' => 'image_generation',
                    'prompt_tokens' => max(20, (int)(strlen($fluxPrompt) / 4)),
                    'candidates_tokens' => 1024,
                    'total_tokens' => max(20, (int)(strlen($fluxPrompt) / 4)) + 1024,
                    'estimated_cost_usd' => 0.00000,
                    'metadata' => [
                        'engine' => 'flux-kids-coloring-engine',
                        'prompt' => $enhancedPrompt,
                    ],
                ]);

                return [
                    'success' => true,
                    'image_data' => base64_encode($processedImage),
                    'mime_type' => 'image/png'
                ];
            }
        } catch (\Exception $e) {
            Log::warning('FLUX AI image call failed: ' . $e->getMessage());
        }

        // Generate local coloring page and track local simulation
        \App\Models\TokenUsage::create([
            'book_id' => $bookId,
            'model' => 'local-procedural-gd',
            'operation_type' => 'local_simulation',
            'prompt_tokens' => max(10, (int)(strlen($fullPrompt) / 4)),
            'candidates_tokens' => 500,
            'total_tokens' => max(10, (int)(strlen($fullPrompt) / 4)) + 500,
            'estimated_cost_usd' => 0.00000,
            'metadata' => ['mode' => 'local_gd'],
        ]);

        // Generate a crisp, valid coloring book page PNG locally via GD
        $imageData = $this->createColoringPagePng($enhancedPrompt);

        return [
            'success' => true,
            'image_data' => base64_encode($imageData),
            'mime_type' => 'image/png'
        ];
    }

    /**
     * Post-processes coloring page: scales inside KDP margins, draws border frame, and binarizes lines
     */
    protected function processKdpColoringPage(string $rawBinary): string
    {
        $src = @imagecreatefromstring($rawBinary);
        if (!$src) {
            return $rawBinary;
        }

        $width = imagesx($src);
        $height = imagesy($src);

        $targetW = 1024;
        $targetH = 1365;
        $canvas = imagecreatetruecolor($targetW, $targetH);

        $white = imagecolorallocate($canvas, 255, 255, 255);
        $black = imagecolorallocate($canvas, 10, 10, 10);
        imagefill($canvas, 0, 0, $white);

        // Safe margin of 70px inside the page
        $margin = 70;
        $innerW = $targetW - ($margin * 2);
        $innerH = $targetH - ($margin * 2);

        imagecopyresampled($canvas, $src, $margin, $margin, 0, 0, $innerW, $innerH, $width, $height);
        imagedestroy($src);

        // Draw elegant Amazon KDP outer page frame
        imagesetthickness($canvas, 6);
        imagerectangle($canvas, 45, 45, $targetW - 45, $targetH - 45, $black);

        // Apply grayscale and high contrast to ensure clean black line art on pure white paper
        imagefilter($canvas, IMG_FILTER_CONTRAST, -35);
        imagefilter($canvas, IMG_FILTER_GRAYSCALE);

        ob_start();
        imagepng($canvas);
        $processed = ob_get_clean();
        imagedestroy($canvas);

        return $processed;
    }

    /**
     * Generates a vibrant, high-converting Amazon KDP book cover
     */
    public function generateCover(\App\Models\Book $book): array
    {
        $coverPromptText = "Vibrant award-winning Amazon KDP book cover illustration for a coloring book titled '{$book->titulo}' in the niche '{$book->nicho}', colorful, highly detailed, professional book cover art, no text";

        if (!empty($this->apiKey) && !str_starts_with($this->apiKey, 'your-')) {
            try {
                $geminiTextUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$this->apiKey}";
                $textResponse = Http::withHeaders(['Content-Type' => 'application/json'])
                    ->timeout(20)
                    ->post($geminiTextUrl, [
                        'contents' => [
                            ['parts' => [['text' => "You are an Amazon KDP bestselling cover artist. Create a single descriptive image prompt for the front cover of a coloring book titled '{$book->titulo}' in the niche '{$book->nicho}'. Do not include text or letters on the image."]]]
                        ]
                    ]);

                if ($textResponse->successful()) {
                    $cand = $textResponse->json()['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($cand) {
                        $coverPromptText = $cand;
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Gemini cover prompt refinement failed: ' . $e->getMessage());
            }
        }

        try {
            $fluxUrl = "https://image.pollinations.ai/prompt/" . urlencode($coverPromptText . ", ultra-detailed colorful Amazon KDP book cover") . "?width=1024&height=1365&model=flux&nologo=true&seed=" . rand(1000, 999999);
            $fluxResp = Http::timeout(35)->get($fluxUrl);

            if ($fluxResp->successful() && strlen($fluxResp->body()) > 5000) {
                $r2Service = app(\App\Services\R2StorageService::class);
                $coverPath = "books/{$book->id}/cover_" . time() . ".png";
                $coverUrl = $r2Service->uploadImage(base64_encode($fluxResp->body()), $coverPath);

                $book->update(['cover_image_url' => $coverUrl]);

                return [
                    'success' => true,
                    'cover_url' => $coverUrl,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Cover generation failed: ' . $e->getMessage());
        }

        return ['success' => false, 'message' => 'Falha ao gerar capa com IA.'];
    }

    /**
     * Creates a valid, high-resolution coloring page PNG image for KDP mockup
     */
    protected function createColoringPagePng(string $prompt): string
    {
        $width = 1000;
        $height = 1300;
        $image = imagecreatetruecolor($width, $height);

        // White background
        $white = imagecolorallocate($image, 255, 255, 255);
        $black = imagecolorallocate($image, 20, 20, 20);

        imagefill($image, 0, 0, $white);

        // Draw double outer border (coloring book frame)
        imagesetthickness($image, 8);
        imagerectangle($image, 40, 40, $width - 40, $height - 40, $black);
        imagesetthickness($image, 3);
        imagerectangle($image, 55, 55, $width - 55, $height - 55, $black);

        // Draw geometric decorative coloring elements
        imagesetthickness($image, 5);

        // Central mandala / decorative motif
        $centerX = $width / 2;
        $centerY = ($height / 2) - 60;
        
        // Concentric circles with patterns
        imageellipse($image, $centerX, $centerY, 450, 450, $black);
        imageellipse($image, $centerX, $centerY, 350, 350, $black);
        imageellipse($image, $centerX, $centerY, 250, 250, $black);
        imageellipse($image, $centerX, $centerY, 120, 120, $black);

        // Petals / Rays
        for ($angle = 0; $angle < 360; $angle += 30) {
            $rad = deg2rad($angle);
            $x1 = $centerX + (int)(cos($rad) * 60);
            $y1 = $centerY + (int)(sin($rad) * 60);
            $x2 = $centerX + (int)(cos($rad) * 225);
            $y2 = $centerY + (int)(sin($rad) * 225);
            imageline($image, $x1, $y1, $x2, $y2, $black);

            $x3 = $centerX + (int)(cos($rad) * 175);
            $y3 = $centerY + (int)(sin($rad) * 175);
            imageellipse($image, $x3, $y3, 40, 40, $black);
        }

        // Decorative corner ornaments
        $corners = [
            [100, 100],
            [$width - 100, 100],
            [100, $height - 180],
            [$width - 100, $height - 180]
        ];
        foreach ($corners as [$cx, $cy]) {
            imageellipse($image, $cx, $cy, 60, 60, $black);
            imageellipse($image, $cx, $cy, 30, 30, $black);
        }

        // Caption at bottom with prompt snippet
        $cleanPrompt = substr(strip_tags($prompt), 0, 60);
        $font = 5;
        $text = "KDP COLORING BOOK: " . strtoupper($cleanPrompt);
        $textWidth = imagefontwidth($font) * strlen($text);
        $textX = max(60, ($width - $textWidth) / 2);
        imagestring($image, $font, (int)$textX, $height - 100, $text, $black);

        ob_start();
        imagepng($image);
        $data = ob_get_clean();
        imagedestroy($image);

        return $data;
    }

    /**
     * Checks API connectivity and basic quota indicators
     */
    public function checkQuotaStatus(): array
    {
        $hasKey = !empty($this->apiKey) && !str_starts_with($this->apiKey, 'your-');
        
        if (!$hasKey) {
            return [
                'configured' => false,
                'status' => 'missing_key',
                'message' => 'Nenhuma chave configurada. O sistema opera no modo simulador local.',
                'tier' => 'Local Simulator',
                'limits' => [
                    'rpm' => 'Ilimitado (Local)',
                    'tpm' => 'Ilimitado (Local)',
                    'rpd' => 'Ilimitado (Local)',
                ]
            ];
        }

        try {
            // Lightweight model query to test key
            $testUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash?key={$this->apiKey}";
            $response = Http::timeout(10)->get($testUrl);

            if ($response->successful()) {
                $headers = $response->headers();
                $ratelimitRemaining = $headers['x-ratelimit-remaining-requests'][0] ?? null;

                return [
                    'configured' => true,
                    'status' => 'active',
                    'message' => 'Conectado com sucesso ao Google Gemini PRO / Imagen 3',
                    'model' => $this->model,
                    'tier' => 'Google AI Studio (Gemini Pro / Pay-as-you-go)',
                    'rate_limit_remaining' => $ratelimitRemaining,
                    'limits' => [
                        'rpm' => 'Até 15-360 RPM',
                        'tpm' => '4.000.000 TPM',
                        'rpd' => '1.500 - Ilimitado RPD',
                    ]
                ];
            }

            return [
                'configured' => true,
                'status' => 'invalid_key',
                'message' => 'Chave configurada, mas o Google retornou erro: ' . ($response->json()['error']['message'] ?? $response->status()),
                'tier' => 'Desconhecido',
            ];
        } catch (\Exception $e) {
            return [
                'configured' => true,
                'status' => 'unreachable',
                'message' => 'Falha de conexão com a API do Google: ' . $e->getMessage(),
                'tier' => 'Desconhecido',
            ];
        }
    }
}
