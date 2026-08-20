<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Image;
use App\Jobs\GenerateImageFromAi;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GenerationController extends Controller
{
    public function generate(Book $book): JsonResponse
    {
        $prompts = $book->prompts;
        
        if ($prompts->isEmpty()) {
            return response()->json(['message' => 'Book has no prompts'], 422);
        }

        $book->update(['status' => 'generating']);
        
        $totalImages = $book->total_paginas_desejadas;
        $imagesQueued = 0;
        $order = 0;

        $totalWeight = $prompts->sum('peso_distribuicao');
        if ($totalWeight <= 0) {
            $totalWeight = $prompts->count();
        }

        $allocated = 0;
        $numPrompts = $prompts->count();

        foreach ($prompts as $index => $prompt) {
            $weight = (float) $prompt->peso_distribuicao > 0 ? (float) $prompt->peso_distribuicao : 1.0;
            if ($index === $numPrompts - 1) {
                $count = $totalImages - $allocated;
            } else {
                $count = (int) round(($weight / $totalWeight) * $totalImages);
                $allocated += $count;
            }

            for ($i = 0; $i < max(0, $count); $i++) {
                $image = Image::create([
                    'book_id' => $book->id,
                    'prompt_id' => $prompt->id,
                    'status' => 'queued',
                    'page_order' => $order++
                ]);
                
                GenerateImageFromAi::dispatch($image);
                $imagesQueued++;
            }
        }

        return response()->json([
            'message' => 'Generation started',
            'total_images' => $imagesQueued,
            'images_queued' => $imagesQueued
        ]);
    }
}
