<?php

namespace App\Filament\Widgets;

use App\Models\Transaction;
use App\Models\Product;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Support\Facades\DB;

class BundlingSuggestions extends BaseWidget
{
    protected static ?int $sort = 4;
    protected int | string | array $columnSpan = 'full';

    protected function getTableHeading(): string
    {
        return '💡 Saran Bundling Produk';
    }

    protected function getTableDescription(): ?string
    {
        return 'Produk yang sering dibeli bersamaan (30 hari terakhir)';
    }

    public function table(Table $table): Table
    {
        $bundlePairs = $this->getBundlingSuggestions();

        return $table
            ->query(
                Product::query()->whereIn('id', collect($bundlePairs)->pluck('product1_id'))
            )
            ->columns([
                Tables\Columns\TextColumn::make('pair')
                    ->label('Pasangan Produk')
                    ->state(function (Product $record) use ($bundlePairs) {
                        $pair = collect($bundlePairs)->firstWhere('product1_id', $record->id);
                        $product2 = Product::find($pair['product2_id']);
                        return $record->name . ' + ' . ($product2->name ?? 'Unknown');
                    }),

                Tables\Columns\TextColumn::make('frequency')
                    ->label('Frekuensi')
                    ->state(function (Product $record) use ($bundlePairs) {
                        $pair = collect($bundlePairs)->firstWhere('product1_id', $record->id);
                        return $pair['count'] . ' kali';
                    })
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('suggestion')
                    ->label('Saran')
                    ->state(function (Product $record) use ($bundlePairs) {
                        $pair = collect($bundlePairs)->firstWhere('product1_id', $record->id);
                        if ($pair['count'] >= 10) {
                            return 'Buat paket bundling!';
                        } elseif ($pair['count'] >= 5) {
                            return 'Display berdekatan';
                        }
                        return 'Pertimbangkan promo';
                    })
                    ->color(function (Product $record) use ($bundlePairs) {
                        $pair = collect($bundlePairs)->firstWhere('product1_id', $record->id);
                        if ($pair['count'] >= 10) return 'success';
                        if ($pair['count'] >= 5) return 'warning';
                        return 'gray';
                    }),
            ])
            ->paginated([5, 10])
            ->defaultPaginationPageOption(5)
            ->emptyStateHeading('Tidak ada data bundling')
            ->emptyStateDescription('Lakukan lebih banyak transaksi untuk mendapatkan saran bundling');
    }

    private function getBundlingSuggestions(): array
    {
        // Get transactions from last 30 days
        $transactions = Transaction::where('status', 'paid')
            ->where('created_at', '>=', now()->subDays(30))
            ->with('items.product')
            ->get();

        $pairs = [];

        foreach ($transactions as $transaction) {
            $items = $transaction->items->pluck('product_id')->toArray();

            // Find pairs
            for ($i = 0; $i < count($items); $i++) {
                for ($j = $i + 1; $j < count($items); $j++) {
                    $key = $items[$i] . '-' . $items[$j];
                    if (!isset($pairs[$key])) {
                        $pairs[$key] = [
                            'product1_id' => $items[$i],
                            'product2_id' => $items[$j],
                            'count' => 0
                        ];
                    }
                    $pairs[$key]['count']++;
                }
            }
        }

        // Sort by frequency
        usort($pairs, function ($a, $b) {
            return $b['count'] - $a['count'];
        });

        // Return top 10
        return array_slice($pairs, 0, 10);
    }
}
