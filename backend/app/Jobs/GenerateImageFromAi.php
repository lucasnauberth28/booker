<?php

namespace App\Jobs;

use App\Models\Image;
use App\Models\Book;
use App\Services\GeminiImageService;
use App\Services\R2StorageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateImageFromAi implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [10, 30, 60];
    public $timeout = 120;

    protected Image $image;

    public function __construct(Image $image)
    {
        $this->image = $image;
    }

    public function handle(GeminiImageService $geminiService, R2StorageService $r2Service): void
    {
        $this->image->update(['status' => 'generating']);
        
        $this->image->load('prompt');
        $promptModel = $this->image->prompt;
        
        $promptText = $promptModel->base_prompt;
        $styleModifiers = $promptModel->style_modifiers ?? [];
        
        $response = $geminiService->generateImage($promptText, $styleModifiers, $this->image->book_id);
        
        if ($response['success']) {
            $path = "books/{$this->image->book_id}/images/{$this->image->id}_" . time() . ".png";
            $url = $r2Service->uploadImage($response['image_data'], $path);
            
            $this->image->update([
                'r2_file_url' => $url,
                'status' => 'approved'
            ]);
        } else {
            $this->image->update(['status' => 'rejected']);
        }
        
        // After all images for the book are processed, update book status
        $book = $this->image->book;
        $pendingImages = $book->images()->whereIn('status', ['queued', 'generating'])->count();
        
        if ($pendingImages === 0) {
            $book->update(['status' => 'curating']);
        }
    }

    public function failed(Throwable $exception): void
    {
        $this->image->update(['status' => 'rejected']);
        Log::error("Job GenerateImageFromAi failed for image {$this->image->id}: " . $exception->getMessage());
    }
}
