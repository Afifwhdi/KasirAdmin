<?php

namespace App\Filament\Widgets;

use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Filament\Support\Enums\IconPosition;

class ProfitAnalysis extends BaseWidget
{
    protected static ?int $sort = 3;
    protected int | string | array $columnSpan = 'full';

    protected function getStats(): array
    {
        $today = Carbon::today();
        $thisWeek = Carbon::now()->startOfWeek();
        $thisMonth = Carbon::now()->startOfMonth();

        $todayStats = $this->calculateProfit($today, Carbon::now());
        $weekStats = $this->calculateProfit($thisWeek, Carbon::now());
        $monthStats = $this->calculateProfit($thisMonth, Carbon::now());

        return [
            Stat::make('Profit Hari Ini', 'Rp ' . number_format($todayStats['profit'], 0, ',', '.'))
                ->description('Dari ' . $todayStats['transactions'] . ' transaksi')
                ->descriptionIcon('heroicon-m-currency-dollar', IconPosition::Before)
                ->color($todayStats['profit'] > 0 ? 'success' : 'danger')
                ->chart($this->getProfitChart('today')),

            Stat::make('Profit Minggu Ini', 'Rp ' . number_format($weekStats['profit'], 0, ',', '.'))
                ->description('Dari ' . $weekStats['transactions'] . ' transaksi')
                ->descriptionIcon('heroicon-m-currency-dollar', IconPosition::Before)
                ->color($weekStats['profit'] > 0 ? 'success' : 'danger')
                ->chart($this->getProfitChart('week')),

            Stat::make('Profit Bulan Ini', 'Rp ' . number_format($monthStats['profit'], 0, ',', '.'))
                ->description('Dari ' . $monthStats['transactions'] . ' transaksi')
                ->descriptionIcon('heroicon-m-currency-dollar', IconPosition::Before)
                ->color($monthStats['profit'] > 0 ? 'success' : 'danger')
                ->chart($this->getProfitChart('month')),

            Stat::make('Margin Rata-rata', $this->getAverageMargin() . '%')
                ->description('Persentase keuntungan')
                ->descriptionIcon('heroicon-m-arrow-trending-up', IconPosition::Before)
                ->color('info'),
        ];
    }

    private function calculateProfit($startDate, $endDate): array
    {
        $transactions = Transaction::where('status', 'paid')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with('items.product')
            ->get();

        $totalRevenue = 0;
        $totalCost = 0;

        foreach ($transactions as $transaction) {
            foreach ($transaction->items as $item) {
                $totalRevenue += $item->price * $item->quantity;
                $totalCost += ($item->product->cost_price ?? 0) * $item->quantity;
            }
        }

        $profit = $totalRevenue - $totalCost;

        return [
            'profit' => $profit,
            'revenue' => $totalRevenue,
            'cost' => $totalCost,
            'transactions' => $transactions->count(),
        ];
    }

    private function getProfitChart(string $period): array
    {
        $data = [];
        $days = match ($period) {
            'today' => 1,
            'week' => 7,
            'month' => 30,
            default => 7,
        };

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $stats = $this->calculateProfit($date->startOfDay(), $date->endOfDay());
            $data[] = $stats['profit'];
        }

        return $data;
    }

    private function getAverageMargin(): string
    {
        $allTransactions = Transaction::where('status', 'paid')
            ->with('items.product')
            ->get();

        if ($allTransactions->isEmpty()) {
            return '0.00';
        }

        $totalRevenue = 0;
        $totalCost = 0;

        foreach ($allTransactions as $transaction) {
            foreach ($transaction->items as $item) {
                $totalRevenue += $item->price * $item->qty;
                $totalCost += ($item->product->cost_price ?? 0) * $item->qty;
            }
        }

        if ($totalRevenue == 0) {
            return '0.00';
        }

        $margin = (($totalRevenue - $totalCost) / $totalRevenue) * 100;

        return number_format($margin, 2, '.', '');
    }
}
