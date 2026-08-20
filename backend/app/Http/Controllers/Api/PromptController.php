<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Prompt;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PromptController extends Controller
{
    public function index(Book $book): JsonResponse
    {
        return response()->json($book->prompts);
    }

    public function store(Request $request, Book $book): JsonResponse
    {
        $validated = $request->validate([
            'base_prompt' => 'required|string',
            'style_modifiers' => 'nullable|array',
            'peso_distribuicao' => 'nullable|numeric|min:0|max:1',
        ]);

        $prompt = $book->prompts()->create($validated);
        return response()->json($prompt, 201);
    }

    public function update(Request $request, Prompt $prompt): JsonResponse
    {
        $validated = $request->validate([
            'base_prompt' => 'required|string',
            'style_modifiers' => 'nullable|array',
            'peso_distribuicao' => 'nullable|numeric|min:0|max:1',
        ]);

        $prompt->update($validated);
        return response()->json($prompt);
    }

    public function destroy(Prompt $prompt): JsonResponse
    {
        $prompt->delete();
        return response()->json(null, 204);
    }
}
