<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;

// Public route - untuk test API status
Route::get('/status', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'API is running',
        'timestamp' => now()->toIso8601String(),
    ]);
});

// Protected API routes - require token authentication
Route::middleware(['api.token'])->group(function () {
    
    // Products endpoints
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{identifier}', [ProductController::class, 'show']);
    Route::post('/products/sync', [ProductController::class, 'sync']);
    
    // User info (Sanctum)
    Route::get('/user', function (Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');
});
