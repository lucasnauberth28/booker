<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\BookPdfCompilerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CompilationController extends Controller
{
    public function compile(Book $book, BookPdfCompilerService $compiler): JsonResponse
    {
        $approvedCount = $book->images()->approved()->count();
        if ($approvedCount === 0) {
            return response()->json(['message' => 'No approved images to compile'], 422);
        }

        try {
            $url = $compiler->compile($book);
            $book->update(['status' => 'ready']);
            
            // Optionally save url to book if field existed, but returning here
            return response()->json([
                'message' => 'Compilation successful',
                'pdf_url' => $url,
                'url' => $url,
            ]);
            
        } catch (\Exception $e) {
            $book->update(['status' => 'curating']);
            return response()->json([
                'message' => 'Compilation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function download(Book $book)
    {
        // Assuming the latest PDF is just derived or stored, 
        // without a specific field we just return an error or placeholder.
        // A real app would store the generated URL in the books table.
        return response()->json([
            'message' => 'PDF URL needs to be fetched from the compiled storage.'
        ]);
    }
}
