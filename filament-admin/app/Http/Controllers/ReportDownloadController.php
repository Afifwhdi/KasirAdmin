<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\CashFlow;
use App\Models\Transaction;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;

class ReportDownloadController extends Controller
{
    public function download(Report $report)
    {
        if (blank($report->path_file)) {
            $report->path_file = $this->defaultPath($report);
            $report->save();
        }

        $disk = 'public';

        if (!Storage::disk($disk)->exists($report->path_file)) {
            $this->generatePdf($disk, $report);
        }

        $downloadName = (trim($report->name) ?: 'LAPORAN') . '.pdf';

        if (!Storage::disk($disk)->exists($report->path_file)) {
            abort(404, 'File laporan tidak ditemukan.');
        }

        return response()->download(
            Storage::disk($disk)->path($report->path_file),
            $downloadName,
            ['Content-Type' => 'application/pdf']
        );
    }

    private function defaultPath(Report $report): string
    {
        $type = $report->report_type ?? 'inflow';
        $start = Carbon::parse($report->start_date)->toDateString();
        $end = Carbon::parse($report->end_date)->toDateString();

        return "reports/{$type}_{$start}_{$end}.pdf";
    }

    private function generatePdf(string $disk, Report $report): void
    {
        $type  = $report->report_type;
        $start = \Illuminate\Support\Carbon::parse($report->start_date)->startOfDay();
        $end   = \Illuminate\Support\Carbon::parse($report->end_date)->endOfDay();

        switch ($type) {
            case 'inflow':
                $view  = 'pdf.reports.pemasukan';
                $title = 'Laporan Uang Masuk';
                $data = \App\Models\CashFlow::query()
                    ->where('type', 'income')                      
                    ->whereBetween('date', [$start->toDateString(), $end->toDateString()]) 
                    ->orderBy('date')
                    ->get();
                break;

            case 'outflow':
                $view  = 'pdf.reports.pengeluaran';
                $title = 'Laporan Uang Keluar';
                $data = \App\Models\CashFlow::query()
                    ->where('type', 'expense')                     
                    ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                    ->orderBy('date')
                    ->get();
                break;

            case 'sales':
            default:
                $view  = 'pdf.reports.penjualan';
                $title = 'Laporan Penjualan';
                $data = \App\Models\Transaction::query()
                    ->with(['transactionItems:transaction_id,quantity,price', 'paymentMethod'])
                    ->whereBetween('created_at', [$start, $end])   // ✅ pakai created_at
                    ->orderBy('created_at')
                    ->get(['id','payment_method_id','transaction_number','total','created_at']);
                break;
        }

        $fileName = sprintf('%s %s s.d. %s', $title, $start->toDateString(), $end->toDateString());

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, [
            'data'     => $data,
            'fileName' => $fileName,
        ])->setPaper('a4', 'portrait');

        $dir = dirname($report->path_file);
        if (!\Illuminate\Support\Facades\Storage::disk($disk)->exists($dir)) {
            \Illuminate\Support\Facades\Storage::disk($disk)->makeDirectory($dir);
        }
        \Illuminate\Support\Facades\Storage::disk($disk)->put($report->path_file, $pdf->output());
    }
}