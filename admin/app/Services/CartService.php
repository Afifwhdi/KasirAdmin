<?php

namespace App\Services;

use App\Models\Product;
use Filament\Notifications\Notification;

class CartService
{
    public function addToOrder(array $orderItems, Product $product): array
    {
        $existingKey = array_search($product->id, array_column($orderItems, 'product_id'));
        $currentQty = $existingKey !== false ? (float) $orderItems[$existingKey]['quantity'] : 0.0;
        $wantedQty  = $currentQty + 1.0;

        if (!$this->ensureStock($product, $wantedQty)) {
            return $orderItems;
        }

        if ($existingKey !== false) {
            $orderItems[$existingKey]['quantity']++;
        } else {
            $orderItems[] = $this->mapProductToCart($product, 1);
        }

        return $orderItems;
    }

    public function increaseQuantity(array $orderItems, Product $product): array
    {
        foreach ($orderItems as $key => $item) {
            if ($item['product_id'] == $product->id) {
                if (!empty($item['locked'])) return $orderItems;

                if ($item['quantity'] + 1 <= (float) ($product->stock ?? INF)) {
                    $orderItems[$key]['quantity']++;
                } else {
                    Notification::make()->title('Stok barang tidak mencukupi')->danger()->send();
                }
                break;
            }
        }
        return $orderItems;
    }

    public function decreaseQuantity(array $orderItems, Product $product): array
    {
        foreach ($orderItems as $key => $item) {
            if ($item['product_id'] == $product->id) {
                if (!empty($item['locked'])) {
                    unset($orderItems[$key]);
                    return array_values($orderItems);
                }

                if ($orderItems[$key]['quantity'] > 1) {
                    $orderItems[$key]['quantity']--;
                } else {
                    unset($orderItems[$key]);
                    return array_values($orderItems);
                }
                break;
            }
        }
        return $orderItems;
    }

    public function confirmPlu(array $orderItems, Product $product, float $qty): array
    {
        $isLocked = (abs($qty - 0.25) < 0.001);
        $effPrice = $this->effectiveUnitPrice($product, $qty);

        $existingKey = array_search($product->id, array_column($orderItems, 'product_id'));

        if ($existingKey !== false) {
            $orderItems[$existingKey] = array_merge(
                $orderItems[$existingKey],
                [
                    'quantity'     => $qty,
                    'price'        => $effPrice,
                    'base_price'   => (int) $product->price,
                    'cost_price'   => (int) $product->cost_price,
                    'total_profit' => $effPrice - (int) $product->cost_price,
                    'image_url'    => $product->image,
                    'locked'       => $isLocked,
                ]
            );
        } else {
            $orderItems[] = $this->mapProductToCart($product, $qty, $effPrice, $isLocked);
        }

        return $orderItems;
    }

    public function calculateTotal(array $orderItems): float
    {
        return array_reduce($orderItems, function ($carry, $item) {
            return $carry + ($item['quantity'] * $item['price']);
        }, 0);
    }

    public function ensureStock(Product $product, float $wantedQty): bool
    {
        if ($product->stock === null) return true;

        $stock = (float) $product->stock;
        if ($stock <= 0) {
            Notification::make()->title("Stok '{$product->name}' habis")->danger()->send();
            return false;
        }

        if ($wantedQty > $stock) {
            Notification::make()->title("Stok '{$product->name}' tidak mencukupi (tersisa {$stock})")->danger()->send();
            return false;
        }

        return true;
    }

    private function effectiveUnitPrice(Product $product, float $qty): int
    {
        $basePrice = (int) $product->price;
        if (abs($qty - 0.25) < 0.000001) {
            return $basePrice + 8000;
        }
        return $basePrice;
    }

    private function mapProductToCart(Product $product, float $qty, ?float $customPrice = null, bool $locked = false): array
    {
        $price = $customPrice ?? $product->price;

        return [
            'product_id'   => $product->id,
            'name'         => $product->name,
            'price'        => $price,
            'base_price'   => (int) $product->price,
            'cost_price'   => (int) $product->cost_price,
            'total_profit' => $price - (float) $product->cost_price,
            'image_url'    => $product->image,
            'quantity'     => $qty,
            'locked'       => $locked,
        ];
    }
}
