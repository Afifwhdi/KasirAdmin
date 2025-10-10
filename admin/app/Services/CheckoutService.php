<?php

namespace App\Services;

use App\Helpers\TransactionHelper;
use App\Jobs\UpdateInventoryAfterTransactionJob;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Filament\Notifications\Notification;

class CheckoutService
{
    public function processCheckout(array $orderItems, int $paymentMethodId, string $customerName, float $cashReceived, float $change, bool $isCash): ?Transaction
    {
        if (empty($orderItems)) {
            Notification::make()->title('Keranjang kosong')->danger()->send();
            return null;
        }

        $insufficient = [];
        foreach ($orderItems as $it) {
            $p = Product::find($it['product_id']);
            if (!$p || $p->stock === null) continue;
            if ((float) $p->stock < (float) $it['quantity']) {
                $insufficient[] = $p->name . " (sisa {$p->stock})";
            }
        }

        if (!empty($insufficient)) {
            Notification::make()
                ->title('Stok tidak mencukupi')
                ->body('Periksa: ' . implode(', ', $insufficient))
                ->danger()->send();
            return null;
        }

        $total = collect($orderItems)->sum(fn($item) => $item['quantity'] * $item['price']);

        $order = Transaction::create([
            'payment_method_id' => $paymentMethodId,
            'transaction_number' => TransactionHelper::generateUniqueTrxId(),
            'name' => $customerName,
            'total' => $total,
            'cash_received' => $isCash ? $cashReceived : $total,
            'change' => $change,
        ]);

        foreach ($orderItems as $item) {
            $product = Product::withTrashed()->find($item['product_id']);

            TransactionItem::create([
                'transaction_id'        => $order->id,
                'product_id'            => $item['product_id'],
                'product_name_snapshot' => $product?->name ?? 'Produk tidak tersedia',
                'quantity'              => $item['quantity'],
                'price'                 => $item['price'],
                'subtotal'              => $item['price'] * $item['quantity'],
                'cost_price'            => $item['cost_price'],
                'total_profit'          => ($item['price'] - $item['cost_price']) * $item['quantity'],
            ]);
        }

        $queueItems = collect($orderItems)
            ->groupBy('product_id')
            ->map(fn($items, $productId) => [
                'product_id' => (int) $productId,
                'quantity'   => (float) collect($items)->sum('quantity'),
            ])
            ->values()
            ->all();

        dispatch(new UpdateInventoryAfterTransactionJob($queueItems));

        Notification::make()->title('Order berhasil disimpan')->success()->send();

        return $order;
    }
}
