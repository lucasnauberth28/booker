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

        // Try FLUX AI engine for authentic Bobbie Goods style, bold and easy 2D coloring pages
        $attempts = [
            "https://image.pollinations.ai/prompt/" . urlencode("Bobbie Goods style coloring book page, bold and easy coloring page for kids, cute cartoon {$enhancedPrompt}, thick uniform black line art, pure white background, completely empty white shapes to color, zero shading, zero grayscale, zero textures, clean 2d vector line art, simple cute kawaii cartoon style, clear outer square border") . "?width=1024&height=1024&model=flux&nologo=true&seed=" . rand(1000, 999999),
            "https://image.pollinations.ai/prompt/" . urlencode("Bobbie Goods style coloring book page, bold and easy coloring page for kids, cute cartoon {$enhancedPrompt}, thick uniform black line art, pure white background, completely empty white shapes to color, zero shading, zero grayscale, clean 2d vector line art") . "?width=1024&height=1024&model=turbo&nologo=true&seed=" . rand(1000, 999999),
        ];

        foreach ($attempts as $fluxUrl) {
            try {
                $fluxResp = Http::withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept' => 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                ])->timeout(55)->get($fluxUrl);

                if ($fluxResp->successful() && strlen($fluxResp->body()) > 5000) {
                    $processedImage = $this->processKdpColoringPage($fluxResp->body());

                    \App\Models\TokenUsage::create([
                        'book_id' => $bookId,
                        'model' => 'flux-bobbie-goods-kdp',
                        'operation_type' => 'image_generation',
                        'prompt_tokens' => max(20, (int)(strlen($fullPrompt) / 4)),
                        'candidates_tokens' => 1024,
                        'total_tokens' => max(20, (int)(strlen($fullPrompt) / 4)) + 1024,
                        'estimated_cost_usd' => 0.00000,
                        'metadata' => [
                            'engine' => 'flux-bobbie-goods-engine',
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
                Log::warning('Coloring page generation attempt failed: ' . $e->getMessage());
            }
        }

        // If all network calls fail, return error instead of geometric mandala
        return [
            'success' => false,
            'message' => 'Falha ao conectar com o motor de ilustração da IA. Tente novamente.'
        ];
    }

    /**
     * Post-processes coloring page: scales inside KDP margins, applies pixel binarization, and draws outer frame
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
        $targetH = 1024;
        $canvas = imagecreatetruecolor($targetW, $targetH);

        $white = imagecolorallocate($canvas, 255, 255, 255);
        $black = imagecolorallocate($canvas, 0, 0, 0);
        imagefill($canvas, 0, 0, $white);

        // Safe margin of 60px inside the page
        $margin = 60;
        $innerW = $targetW - ($margin * 2);
        $innerH = $targetH - ($margin * 2);

        imagecopyresampled($canvas, $src, $margin, $margin, 0, 0, $innerW, $innerH, $width, $height);
        imagedestroy($src);

        // Pixel-level binarization: guarantees 100% pure black outlines (#000000) on pure white (#FFFFFF)
        for ($x = 0; $x < $targetW; $x++) {
            for ($y = 0; $y < $targetH; $y++) {
                $rgb = imagecolorat($canvas, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $gray = (int)($r * 0.299 + $g * 0.587 + $b * 0.114);

                // Threshold: pixel lighter than 175 becomes white, otherwise solid black
                if ($gray > 175) {
                    imagesetpixel($canvas, $x, $y, $white);
                } else {
                    imagesetpixel($canvas, $x, $y, $black);
                }
            }
        }

        // Draw elegant Amazon KDP outer page frame
        imagesetthickness($canvas, 6);
        imagerectangle($canvas, 40, 40, $targetW - 40, $targetH - 40, $black);

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
