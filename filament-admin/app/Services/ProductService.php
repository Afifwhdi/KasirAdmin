<?php

namespace App\Services;

use App\Models\Barcode;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Filament\Notifications\Notification;

class ProductService
{
    public function loadProducts($selectedCategory, $search, $limit = 5)
    {
        $cacheKey = "products:" . ($selectedCategory ?? 'all') . ":{$search}:limit:{$limit}";

        return Cache::tags(['products'])->remember($cacheKey, 60, function () use ($selectedCategory, $search, $limit) {
            $query = Product::query()
                ->select('id', 'name', 'price', 'barcode', 'image', 'category_id', 'is_plu_enabled', 'stock', 'cost_price')
                ->with('category:id,name')
                ->when($selectedCategory, fn($q) => $q->where('category_id', $selectedCategory))
                ->where('is_active', true);

            if (filled($search)) {
                $s = trim($search);
                $query->where(function ($q) use ($s) {
                    $q->where('name', 'like', "%{$s}%")
                        ->orWhere('barcode', 'like', "%{$s}%");
                });
            }

            return $query->orderBy('name')->limit($limit)->get();
        });
    }

    public function addToCartByBarcode(string $code, callable $addToOrder, callable $openPluModal, callable $resetBarcode)
    {
        $b = Barcode::with('product')->where('code', $code)->first();

        if ($b && $b->product) {
            $product = $b->product;
            if (!$product->is_active) {
                Notification::make()->title('Produk tidak aktif')->danger()->send();
                $resetBarcode();
                return;
            }

            $addToOrder($product->id);
            $resetBarcode();
            return;
        }

        $product = Product::where('barcode', $code)->where('is_active', true)->first();

        if ($product) {
            $product->is_plu_enabled
                ? $openPluModal($product->id)
                : $addToOrder($product->id);
        } else {
            Notification::make()->title('Produk tidak ditemukan: ' . $code)->danger()->send();
        }

        $resetBarcode();
    }
}
