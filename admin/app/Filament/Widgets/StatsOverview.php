<?php

namespace App\Filament\Widgets;

use Carbon\Carbon;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Filament\Support\Enums\IconPosition;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\Concerns\InteractsWithPageFilters;

class StatsOverview extends BaseWidget
{
    use InteractsWithPageFilters;
    
    protected static ?int $sort = 1;
    
    protected function getHeading(): string
    {
        return '📊 Ringkasan Penjualan';
    }

    protected function getStats(): array
    {
        // Get date range from filters
        $range = $this->filters['range'] ?? 'today';
        
        switch ($range) {
            case 'yesterday':
                $start = now()->subDay()->startOfDay();
                $end = now()->subDay()->endOfDay();
                break;
            case 'this_week':
                $start = now()->startOfWeek();
                $end = now()->endOfWeek();
                break;
            case 'this_month':
                $start = now()->startOfMonth();
                $end = now()->endOfMonth();
                break;
            case 'custom':
                $start = Carbon::parse($this->filters['startDate'] ?? now())->startOfDay();
                $end = Carbon::parse($this->filters['endDate'] ?? now())->endOfDay();
                break;
            default: // today
                $start = now()->startOfDay();
                $end = now()->endOfDay();
        }
        
        $sales = Transaction::where('status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->sum('total');
        
        $transactions = Transaction::where('status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->count();
        
        $avgTransaction = $transactions > 0 ? $sales / $transactions : 0;
        
        // Chart data 7 hari terakhir
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $chartSales = Transaction::where('status', 'paid')
                ->whereDate('created_at', $date)
                ->sum('total');
            $chartData[] = $chartSales;
        }
        
        return [
            Stat::make('Total Penjualan', 'Rp ' . number_format($sales, 0, ",", "."))
                ->description($transactions . ' transaksi')
                ->descriptionIcon('heroicon-m-banknotes', IconPosition::Before)
                ->chart($chartData)
                ->color('success'),
                
            Stat::make('Rata-rata', 'Rp ' . number_format($avgTransaction, 0, ",", "."))
                ->description('Per transaksi')
                ->descriptionIcon('heroicon-m-calculator', IconPosition::Before)
                ->color('info'),
                
            Stat::make('Trend 7 Hari', 'Grafik')
                ->description('Penjualan harian')
                ->descriptionIcon('heroicon-m-chart-bar', IconPosition::Before)
                ->chart($chartData)
                ->color('primary'),
        ];
    }
}
