<?php

namespace App\Jobs;

use App\Models\NotificationLog;
use App\Models\NotificationSetting;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Services\FonnteService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendDailyReportJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $setting = NotificationSetting::where('is_active', true)->first();

            if (!$setting) {
                Log::info('No active notification settings found');
                return;
            }

            $receivers = $setting->receivers_array;

            if (empty($receivers)) {
                Log::warning('No receivers configured in notification settings');
                return;
            }

            // Generate report message
            $message = $this->generateDailyReport($setting->top_limit);

            // Send to all receivers
            $fonnteService = new FonnteService();

            foreach ($receivers as $receiver) {
                $result = $fonnteService->sendMessage($receiver, $message);

                // Log the result
                NotificationLog::create([
                    'receiver' => $receiver,
                    'message' => $message,
                    'status' => $result['success'] ? 'success' : 'failed',
                    'sent_at' => now(),
                ]);

                if ($result['success']) {
                    Log::info("Daily report sent to {$receiver}");
                } else {
                    Log::error("Failed to send daily report to {$receiver}: {$result['message']}");
                }
            }
        } catch (\Exception $e) {
            Log::error('SendDailyReportJob failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Generate daily report message
     */
    protected function generateDailyReport(int $topLimit = 3): string
    {
        $today = Carbon::today();

        // Get today's transactions
        $transactions = Transaction::whereDate('created_at', $today)
            ->where('status', 'paid')
            ->get();

        $totalTransactions = $transactions->count();
        $totalSales = $transactions->sum('total');

        // Get top selling products
        $topProducts = TransactionItem::query()
            ->whereHas('transaction', function ($query) use ($today) {
                $query->whereDate('created_at', $today)
                    ->where('status', 'paid');
            })
            ->with('productWithTrashed')
            ->select('product_id', DB::raw('SUM(quantity) as total_qty'))
            ->groupBy('product_id')
            ->orderByDesc('total_qty')
            ->limit($topLimit)
            ->get();

        // Format message
        $message = "📊 Laporan Harian Kasir\n";
        $message .= "Total Transaksi: {$totalTransactions}\n";
        $message .= "Total Penjualan: Rp " . number_format($totalSales, 0, ',', '.') . "\n\n";

        if ($topProducts->isNotEmpty()) {
            $message .= "Produk Terlaris:\n";
            foreach ($topProducts as $item) {
                $productName = $item->productWithTrashed->name ?? 'Produk Tidak Diketahui';
                $message .= "- {$productName} ({$item->total_qty}x)\n";
            }
        } else {
            $message .= "Belum ada produk terjual hari ini.\n";
        }

        $message .= "\n📅 " . $today->locale('id')->isoFormat('D MMMM YYYY');

        return $message;
    }
}
