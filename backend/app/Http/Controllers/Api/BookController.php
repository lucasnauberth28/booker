<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BookController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Book::with('setup')
            ->withCount([
                'images as images_queued' => fn($q) => $q->where('status', 'queued'),
                'images as images_generating' => fn($q) => $q->where('status', 'generating'),
                'images as images_approved' => fn($q) => $q->where('status', 'approved'),
                'images as images_rejected' => fn($q) => $q->where('status', 'rejected'),
            ]);
        
        if ($request->has('status') && $request->query('status') !== '') {
            $query->byStatus($request->query('status'));
        }
        
        $books = $query->get()->map(function ($book) {
            $book->images_count = [
                'total' => ($book->images_queued ?? 0) + ($book->images_generating ?? 0) + ($book->images_approved ?? 0) + ($book->images_rejected ?? 0),
                'queued' => $book->images_queued ?? 0,
                'generating' => $book->images_generating ?? 0,
                'approved' => $book->images_approved ?? 0,
                'rejected' => $book->images_rejected ?? 0,
            ];
            return $book;
        });

        return response()->json($books);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'setup_id' => 'required|exists:setups,id',
            'titulo' => 'required|string|max:255',
            'nicho' => 'required|string|max:255',
            'total_paginas_desejadas' => 'required|integer|min:1|max:500',
        ]);

        $book = Book::create($validated);
        $book->load('setup');
        return response()->json($book, 201);
    }

    public function show(Book $book): JsonResponse
    {
        $book->load(['setup', 'prompts']);
        $book->loadCount([
            'images as images_queued' => fn($query) => $query->where('status', 'queued'),
            'images as images_generating' => fn($query) => $query->where('status', 'generating'),
            'images as images_approved' => fn($query) => $query->where('status', 'approved'),
            'images as images_rejected' => fn($query) => $query->where('status', 'rejected'),
        ]);
        
        $book->images_count = [
            'total' => $book->images()->count(),
            'queued' => $book->images_queued ?? 0,
            'generating' => $book->images_generating ?? 0,
            'approved' => $book->images_approved ?? 0,
            'rejected' => $book->images_rejected ?? 0,
        ];
        
        return response()->json($book);
    }

    public function update(Request $request, Book $book): JsonResponse
    {
        $validated = $request->validate([
            'setup_id' => 'required|exists:setups,id',
            'titulo' => 'required|string|max:255',
            'nicho' => 'required|string|max:255',
            'total_paginas_desejadas' => 'required|integer|min:1|max:500',
        ]);

        $book->update($validated);
        $book->load('setup');
        return response()->json($book);
    }

    public function destroy(Book $book): JsonResponse
    {
        // Delete all generated images and prompts
        $book->images()->delete();
        $book->prompts()->delete();

        // Remove files from storage
        try {
            \Illuminate\Support\Facades\Storage::disk('public')->deleteDirectory("books/{$book->id}");
            
            $r2Key = config('filesystems.disks.r2.key');
            if (!empty($r2Key) && !str_starts_with($r2Key, 'your-')) {
                \Illuminate\Support\Facades\Storage::disk('r2')->deleteDirectory("books/{$book->id}");
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Failed to clean storage directory for book {$book->id}: " . $e->getMessage());
        }

        $book->delete();
        return response()->json(['message' => 'Livro excluído com sucesso'], 200);
    }
}
