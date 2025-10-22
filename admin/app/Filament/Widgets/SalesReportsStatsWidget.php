<?php

namespace App\Filament\Widgets;

use App\Models\Transaction;
use Carbon\Carbon;
use Filament\Support\Enums\IconPosition;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\Concerns\InteractsWithPageFilters;

class SalesReportsStatsWidget extends StatsOverviewWidget
{
    use InteractsWithPageFilters;

    protected function getHeading(): string
    {
        return 'Analisis Penjualan Detail';
    }

    protected function getStats(): array
    {
        $start = Carbon::parse($this->filters['startDate'] ?? Carbon::today())->startOfDay();
        $end = Carbon::parse($this->filters['endDate'] ?? Carbon::today())->endOfDay();

        $transactions = Transaction::with(['items.product', 'paymentMethod'])
            ->where('status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->get();

        $totalRevenue = 0;
        $totalItems = 0;
        $productsSold = [];

        foreach ($transactions as $transaction) {
            $totalRevenue += $transaction->total;
            foreach ($transaction->items as $item) {
                $totalItems += $item->quantity;
                $productName = $item->product->name ?? 'Unknown';
                if (!isset($productsSold[$productName])) {
                    $productsSold[$productName] = 0;
                }
                $productsSold[$productName] += $item->quantity;
            }
        }

        $avgTransaction = $transactions->count() > 0 ? $totalRevenue / $transactions->count() : 0;

        arsort($productsSold);
        $topProduct = !empty($productsSold) ? array_key_first($productsSold) : 'Belum ada';
        $topProductQty = !empty($productsSold) ? $productsSold[$topProduct] : 0;

        $paymentMethods = $transactions->groupBy('paymentMethod.name')->map->count()->sortDesc();
        $topPayment = $paymentMethods->keys()->first() ?? 'Belum ada';
        $topPaymentCount = $paymentMethods->first() ?? 0;

        return [
            Stat::make('Transaksi', $transactions->count())
                ->description('Total transaksi')
                ->descriptionIcon('heroicon-m-clipboard-document-check', IconPosition::Before)
                ->color('primary'),

            Stat::make('Pendapatan', 'Rp ' . number_format($totalRevenue, 0, ',', '.'))
                ->description($totalItems . ' items terjual')
                ->descriptionIcon('heroicon-m-banknotes', IconPosition::Before)
                ->color('success'),

            Stat::make('Rata-rata', 'Rp ' . number_format($avgTransaction, 0, ',', '.'))
                ->description('Per transaksi')
                ->descriptionIcon('heroicon-m-calculator', IconPosition::Before)
                ->color('info'),

            Stat::make('Produk Terlaris', $topProduct)
                ->description($topProductQty . ' terjual')
                ->descriptionIcon('heroicon-m-star', IconPosition::Before)
                ->color('warning'),

            Stat::make('Pembayaran', $topPayment)
                ->description($topPaymentCount . ' transaksi')
                ->descriptionIcon('heroicon-m-credit-card', IconPosition::Before)
                ->color('success'),
        ];
    }
}
