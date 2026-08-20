<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\SetupController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\PromptController;
use App\Http\Controllers\Api\ImageController;
use App\Http\Controllers\Api\GenerationController;
use App\Http\Controllers\Api\CompilationController;

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
    Route::post('compile', [CompilationController::class, 'compile']);
    Route::get('download-pdf', [CompilationController::class, 'download']);
});

// Image status update (standalone)
Route::patch('images/{image}/status', [ImageController::class, 'updateStatus']);
