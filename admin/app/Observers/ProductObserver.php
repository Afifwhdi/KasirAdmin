<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\User;
use App\Notifications\LowStockNotification;
use Illuminate\Support\Facades\Cache;

class ProductObserver
{
    public function creating(Product $product)
    {
        if (empty($product->image)) {
            $product->image = 'products/product-default.jpg';
        }

        if (empty($product->sku)) {
            $product->sku = $this->generateSku($product);
        }

        if (empty($product->barcode)) {
            $product->barcode = $this->generateUniqueBarcode();
        }
    }

    public function created(Product $product): void
    {
        $this->clearCache();
    }

    public function updated(Product $product): void
    {
        $this->clearCache();

        // Check if stock is low and send notification to admins
        if ($product->isDirty('stock') && $product->stock <= $product->min_stock && $product->stock > 0) {
            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                $admin->notify(new LowStockNotification($product));
            }
        }
    }

    public function deleted(Product $product): void
    {
        $this->clearCache();
    }

    public function restored(Product $product): void
    {
        $this->clearCache();
    }

    public function forceDeleted(Product $product): void
    {
        $this->clearCache();
    }

    private function generateSku(Product $product): string
    {
        $category = $product->category;
        $categoryCode = 'GEN';
        if ($category) {
            $categoryCode = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $category->name), 0, 3));
        }

        $nameParts = explode(' ', $product->name);
        $nameCode = '';
        foreach ($nameParts as $part) {
            $cleanedPart = preg_replace('/[^a-zA-Z]/', '', $part);
            if (!empty($cleanedPart)) {
                $nameCode .= '-' . strtoupper(substr($cleanedPart, 0, 3));
            }
        }

        $baseSku = $categoryCode . $nameCode;

        $latestProduct = Product::orderBy('id', 'desc')->first();
        $nextId = $latestProduct ? $latestProduct->id + 1 : 1;

        $uniqueSku = $baseSku . '-' . $nextId;

        $counter = 2;
        while (Product::where('sku', $uniqueSku)->exists()) {
            $uniqueSku = $baseSku . '-' . $nextId . '-' . $counter;
            $counter++;
        }

        return $uniqueSku;
    }

    private function generateUniqueBarcode(): string
    {
        do {
            $base = '200' . str_pad(mt_rand(0, 999999999), 9, '0', STR_PAD_LEFT);

            $sum = 0;
            for ($i = 0; $i < strlen($base); $i++) {
                $sum += (int)$base[$i] * (($i % 2 === 0) ? 1 : 3);
            }
            $checksum = (10 - ($sum % 10)) % 10;

            $barcode = $base . $checksum;
        } while (Product::where('barcode', $barcode)->exists());

        return $barcode;
    }

    private function clearCache(): void
    {
        try {
            Cache::tags(['products'])->flush();
        } catch (\Exception $e) {
            Cache::forget('products:all');
        }
    }
}
