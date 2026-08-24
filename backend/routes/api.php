<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SetupController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\PromptController;
use App\Http\Controllers\Api\ImageController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\CompilationController;
use App\Http\Controllers\Api\UsageController;

// Setups
Route::apiResource('setups', SetupController::class);

// Books
Route::apiResource('books', BookController::class);

// Book sub-resources
Route::prefix('books/{book}')->group(function () {
    Route::apiResource('prompts', PromptController::class)->shallow();
    Route::get('images', [ImageController::class, 'index']);
    Route::post('images/reorder', [ImageController::class, 'reorder']);
    Route::post('generate', [GenerationController::class, 'generate']);
    Route::post('generate-cover', [GenerationController::class, 'generateCover']);
    Route::post('compile', [CompilationController::class, 'compile']);
    Route::get('download-pdf', [CompilationController::class, 'download']);
    Route::get('usage', [UsageController::class, 'bookUsage']);
});

// Image actions (standalone)
Route::patch('images/{image}/status', [ImageController::class, 'updateStatus']);
Route::post('images/{image}/regenerate', [ImageController::class, 'regenerate']);
Route::delete('images/{image}', [ImageController::class, 'destroy']);

// Token & Quota Usage
Route::get('usage/summary', [UsageController::class, 'summary']);
