<?php

namespace App\Filament\Widgets;

use Carbon\Carbon;
use App\Models\Transaction;
use App\Models\Product;
use Filament\Support\Enums\IconPosition;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;

class TotalStatsOverview extends BaseWidget
{
    protected static ?int $sort = 2;
    
    protected function getHeading(): string
    {
        return 'Statistik Keseluruhan';
    }

    protected function getStats(): array
    {
        // Total Penjualan Keseluruhan
        $totalRevenue = Transaction::where('status', 'paid')->sum('total');
        
        // Total Transaksi
        $totalTransactions = Transaction::where('status', 'paid')->count();
        
        // Rata-rata Penjualan per Transaksi
        $averageTransaction = $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0;
        
        // Total Produk
        $totalProducts = Product::count();
        
        // Produk Stock Rendah
        $lowStock = Product::whereColumn('stock', '<=', 'min_stock')->count();
        
        return [
            Stat::make('Total Pendapatan', 'Rp ' . number_format($totalRevenue, 0, ",", "."))
                ->description(number_format($totalTransactions, 0, ",", ".") . ' transaksi')
                ->descriptionIcon('heroicon-m-banknotes', IconPosition::Before)
                ->color('success'),
                
            Stat::make('Rata-rata', 'Rp ' . number_format($averageTransaction, 0, ",", "."))
                ->description('Per transaksi')
                ->descriptionIcon('heroicon-m-calculator', IconPosition::Before)
                ->color('info'),
                
            Stat::make('Stok Rendah', $lowStock . ' produk')
                ->description('Total ' . $totalProducts . ' produk')
                ->descriptionIcon('heroicon-m-cube', IconPosition::Before)
                ->color($lowStock > 0 ? 'warning' : 'success'),
        ];
    }
}
