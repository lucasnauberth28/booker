<?php

namespace App\Services;

use App\Models\Book;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookPdfCompilerService
{
    protected R2StorageService $r2Service;

    public function __construct(R2StorageService $r2Service)
    {
        $this->r2Service = $r2Service;
    }

    public function compile(Book $book): string
    {
        try {
            $book->load('setup');
            $images = $book->images()->approved()->orderBy('page_order')->get();

            if ($images->isEmpty()) {
                throw new \Exception("No approved images found for book ID {$book->id}");
            }

            $setup = $book->setup;
            
            // Convert inches to points (1 inch = 72 points)
            $widthPt = $setup->largura_polegadas * 72;
            $heightPt = $setup->altura_polegadas * 72;
            $marginPt = $setup->margem_seguranca * 72;

            $pdf = new \FPDF('P', 'pt', [$widthPt, $heightPt]);
            $pdf->SetMargins(0, 0, 0);
            $pdf->SetAutoPageBreak(false);

            $tempDir = storage_path('app/temp_pdf_' . Str::random(10));
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            foreach ($images as $image) {
                $pdf->AddPage();
                
                $tempImgPath = $tempDir . '/' . md5($image->id . '_' . $image->r2_file_url) . '.png';
                
                // Fetch image content from URL or local storage
                $imageContents = null;
                $url = $image->r2_file_url;
                
                if (!empty($url)) {
                    if (str_starts_with($url, 'http://') || str_starts_with($url, 'https://')) {
                        try {
                            $resp = \Illuminate\Support\Facades\Http::timeout(30)->get($url);
                            if ($resp->successful()) {
                                $imageContents = $resp->body();
                            }
                        } catch (\Exception $e) {
                            Log::warning("Could not download image from {$url}: " . $e->getMessage());
                        }
                    }
                    
                    // Fallback to local storage disk
                    if (!$imageContents) {
                        $relativePath = "books/{$book->id}/images/{$image->id}_*.png";
                        // Extract path from URL if local
                        $parsedPath = parse_url($url, PHP_URL_PATH);
                        if ($parsedPath) {
                            $storagePath = ltrim(str_replace('/storage/', '', $parsedPath), '/');
                            if (Storage::disk('public')->exists($storagePath)) {
                                $imageContents = Storage::disk('public')->get($storagePath);
                            }
                        }
                    }
                }
                
                // Fallback: create placeholder if not fetched
                if (!$imageContents) {
                    $geminiService = app(GeminiImageService::class);
                    $promptText = $image->prompt?->base_prompt ?? 'Coloring page';
                    $imageContents = base64_decode($geminiService->generateImage($promptText)['image_data']);
                }

                file_put_contents($tempImgPath, $imageContents);

                // Place the image on the page respecting margins
                $usableWidth = max(10, $widthPt - (2 * $marginPt));
                $usableHeight = max(10, $heightPt - (2 * $marginPt));
                $pdf->Image($tempImgPath, $marginPt, $marginPt, $usableWidth, $usableHeight);

                if ($setup->inserir_paginas_em_branco_verso) {
                    $pdf->AddPage();
                }
            }

            $pdfOutput = $pdf->Output('S');
            
            $r2Path = "books/{$book->id}/compiled_" . time() . ".pdf";
            
            // R2StorageService expects base64 based on our implementation earlier, 
            // but for PDF we can just use Storage directly or base64 encode it here.
            $pdfUrl = $this->r2Service->uploadImage(base64_encode($pdfOutput), $r2Path);

            // Clean up temp files
            $this->deleteDirectory($tempDir);

            return $pdfUrl;

        } catch (\Exception $e) {
            Log::error("PDF Compilation Error: " . $e->getMessage());
            throw $e;
        }
    }
    
    private function deleteDirectory($dir) {
        if (!file_exists($dir)) {
            return true;
        }
        if (!is_dir($dir)) {
            return unlink($dir);
        }
        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') {
                continue;
            }
            if (!$this->deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
                return false;
            }
        }
        return rmdir($dir);
    }
}
