<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Image;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ImageController extends Controller
{
    public function index(Book $book): JsonResponse
    {
        $images = $book->images()->with('prompt')->orderBy('page_order')->get();
        return response()->json($images);
    }

    public function updateStatus(Request $request, Image $image): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $image->update($validated);
        return response()->json($image);
    }

    public function reorder(Request $request, Book $book): JsonResponse
    {
        $validated = $request->validate([
            'images' => 'required|array',
            'images.*.id' => 'required|exists:images,id',
            'images.*.page_order' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($validated, $book) {
            foreach ($validated['images'] as $imgData) {
                // Ensure image belongs to the book
                Image::where('id', $imgData['id'])
                    ->where('book_id', $book->id)
                    ->update(['page_order' => $imgData['page_order']]);
            }
        });

        return response()->json(['message' => 'Images reordered successfully']);
    }

    public function regenerate(Image $image): JsonResponse
    {
        $image->update([
            'status' => 'generating',
        ]);

        \App\Jobs\GenerateImageFromAi::dispatch($image);

        return response()->json([
            'message' => 'Regeneração iniciada para esta página.',
            'image' => $image->fresh(),
        ]);
    }

    public function destroy(Image $image): JsonResponse
    {
        if ($image->r2_file_url) {
            $parsedPath = parse_url($image->r2_file_url, PHP_URL_PATH);
            $storagePath = str_replace('/storage/', '', $parsedPath);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($storagePath);
        }

        $image->delete();

        return response()->json(['message' => 'Página removida com sucesso.']);
    }
}
