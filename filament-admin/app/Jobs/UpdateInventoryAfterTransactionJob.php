<?php

namespace App\Jobs;

use App\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UpdateInventoryAfterTransactionJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    public array $items;

    public function __construct(array $items)
    {
        $this->items = $items;
    }

    public function handle(): void
    {
        foreach ($this->items as $it) {
            if (!isset($it['product_id'], $it['quantity'])) {
                continue;
            }

            $product = Product::find((int) $it['product_id']);
            if (!$product) {
                continue;
            }

            $product->decrement('stock', (float) $it['quantity']);
        }
    }
}
