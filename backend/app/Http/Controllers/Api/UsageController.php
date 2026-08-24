<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TokenUsage;
use App\Models\Book;
use App\Services\GeminiImageService;
use Illuminate\Http\JsonResponse;

class UsageController extends Controller
{
    protected GeminiImageService $geminiService;

    public function __construct(GeminiImageService $geminiService)
    {
        $this->geminiService = $geminiService;
    }

    public function summary(): JsonResponse
    {
        $totalTokens = (int) TokenUsage::sum('total_tokens');
        $promptTokens = (int) TokenUsage::sum('prompt_tokens');
        $candidatesTokens = (int) TokenUsage::sum('candidates_tokens');
        $totalRequests = (int) TokenUsage::count();
        $totalCostUsd = (float) TokenUsage::sum('estimated_cost_usd');
        $usdToBrlRate = 5.50;
        $totalCostBrl = round($totalCostUsd * $usdToBrlRate, 4);

        $recentCalls = TokenUsage::with('book:id,titulo,nicho')
            ->latest()
            ->limit(10)
            ->get();

        $quotaStatus = $this->geminiService->checkQuotaStatus();

        return response()->json([
            'total_tokens' => $totalTokens,
            'prompt_tokens' => $promptTokens,
            'candidates_tokens' => $candidatesTokens,
            'total_requests' => $totalRequests,
            'estimated_cost_usd' => round($totalCostUsd, 4),
            'estimated_cost_brl' => $totalCostBrl,
            'quota' => $quotaStatus,
            'recent_calls' => $recentCalls,
        ]);
    }

    public function bookUsage(int $bookId): JsonResponse
    {
        $book = Book::findOrFail($bookId);
        
        $totalTokens = (int) TokenUsage::where('book_id', $bookId)->sum('total_tokens');
        $totalRequests = (int) TokenUsage::where('book_id', $bookId)->count();
        $totalCostUsd = (float) TokenUsage::where('book_id', $bookId)->sum('estimated_cost_usd');
        $totalCostBrl = round($totalCostUsd * 5.50, 4);

        return response()->json([
            'book_id' => $bookId,
            'book_title' => $book->titulo,
            'total_tokens' => $totalTokens,
            'total_requests' => $totalRequests,
            'estimated_cost_usd' => round($totalCostUsd, 4),
            'estimated_cost_brl' => $totalCostBrl,
        ]);
    }
}