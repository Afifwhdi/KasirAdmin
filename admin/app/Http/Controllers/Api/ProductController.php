<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * Get all products with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $limit = $request->input('limit', 50);
        $page = $request->input('page', 1);
        $search = $request->input('search');

        $query = Product::with('category')
            ->where('is_active', true)
            ->orderBy('name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $total = $query->count();
        $products = $query->skip(($page - 1) * $limit)
            ->take($limit)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => (string) $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'barcode' => $product->barcode,
                    'sku' => $product->sku,
                    'stock' => $product->stock,
                    'is_plu_enabled' => $product->is_plu_enabled,
                    'category' => $product->category ? [
                        'id' => (string) $product->category->id,
                        'name' => $product->category->name,
                    ] : null,
                ];
            });

        return response()->json([
            'status' => 'success',
            'message' => 'Products retrieved successfully',
            'data' => $products,
            'meta' => [
                'total' => $total,
                'page' => (int) $page,
                'limit' => (int) $limit,
                'totalPages' => ceil($total / $limit),
            ],
        ]);
    }

    /**
     * Get single product by ID or barcode
     */
    public function show(Request $request, string $identifier): JsonResponse
    {
        $product = Product::with('category')
            ->where('id', $identifier)
            ->orWhere('barcode', $identifier)
            ->orWhere('sku', $identifier)
            ->first();

        if (!$product) {
            return response()->json([
                'status' => 'error',
                'message' => 'Product not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Product retrieved successfully',
            'data' => [
                'id' => (string) $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'cost_price' => $product->cost_price,
                'barcode' => $product->barcode,
                'sku' => $product->sku,
                'stock' => $product->stock,
                'min_stock' => $product->min_stock,
                'is_plu_enabled' => $product->is_plu_enabled,
                'is_active' => $product->is_active,
                'category' => $product->category ? [
                    'id' => (string) $product->category->id,
                    'name' => $product->category->name,
                ] : null,
            ],
        ]);
    }

    /**
     * Sync products - get products updated after timestamp
     */
    public function sync(Request $request): JsonResponse
    {
        $request->validate([
            'last_sync' => 'nullable|date',
        ]);

        $lastSync = $request->input('last_sync');

        $query = Product::with('category')
            ->where('is_active', true);

        if ($lastSync) {
            $query->where('updated_at', '>', $lastSync);
        }

        $products = $query->get()->map(function ($product) {
            return [
                'id' => (string) $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'barcode' => $product->barcode,
                'sku' => $product->sku,
                'stock' => $product->stock,
                'is_plu_enabled' => $product->is_plu_enabled,
                'category' => $product->category ? [
                    'id' => (string) $product->category->id,
                    'name' => $product->category->name,
                ] : null,
                'updated_at' => $product->updated_at->toIso8601String(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Products synced successfully',
            'data' => $products,
            'meta' => [
                'count' => $products->count(),
                'sync_timestamp' => now()->toIso8601String(),
            ],
        ]);
    }
}
