<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class R2StorageService
{
    protected function getDiskName(): string
    {
        $r2Key = config('filesystems.disks.r2.key');
        if (!empty($r2Key) && !str_starts_with($r2Key, 'your-')) {
            return 'r2';
        }
        return 'public';
    }

    public function uploadImage(string $imageData, string $path): string
    {
        try {
            $decodedData = base64_decode($imageData);
            $disk = $this->getDiskName();
            
            // Cloudflare R2 does not support object ACLs, so do not pass 'public' visibility flag
            Storage::disk($disk)->put($path, $decodedData);
            
            return Storage::disk($disk)->url($path);
        } catch (\Exception $e) {
            Log::error('Storage Upload Error: ' . $e->getMessage());
            throw $e;
        }
    }

    public function deleteImage(string $path): bool
    {
        try {
            $disk = $this->getDiskName();
            return Storage::disk($disk)->delete($path);
        } catch (\Exception $e) {
            Log::error('Storage Delete Error: ' . $e->getMessage());
            return false;
        }
    }

    public function getUrl(string $path): string
    {
        try {
            $disk = $this->getDiskName();
            return Storage::disk($disk)->url($path);
        } catch (\Exception $e) {
            Log::error('Storage GetUrl Error: ' . $e->getMessage());
            return '';
        }
    }

    public function getBytes(string $path): ?string
    {
        try {
            $disk = $this->getDiskName();
            if (Storage::disk($disk)->exists($path)) {
                return Storage::disk($disk)->get($path);
            }
            return null;
        } catch (\Exception $e) {
            Log::error('Storage GetBytes Error: ' . $e->getMessage());
            return null;
        }
    }
}
