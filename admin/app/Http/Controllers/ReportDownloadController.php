<?php

namespace App\Http\Controllers;

use App\Models\Report;
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

        $downloadName = (trim($report->name) ?: 'LAPORAN_PENJUALAN') . '.pdf';

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
        $start = Carbon::parse($report->start_date)->toDateString();
        $end = Carbon::parse($report->end_date)->toDateString();

        return "reports/penjualan_{$start}_{$end}.pdf";
    }

    private function generatePdf(string $disk, Report $report): void
    {
        $start = Carbon::parse($report->start_date)->startOfDay();
        $end   = Carbon::parse($report->end_date)->endOfDay();

        $view  = 'pdf.reports.penjualan';
        $title = 'Laporan Penjualan';
        $data = Transaction::query()
            ->with(['transactionItems:transaction_id,quantity,price', 'paymentMethod'])
            ->where('status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->orderBy('created_at')
            ->get(['id','payment_method_id','transaction_number','total','created_at']);

        $fileName = sprintf('%s %s s.d. %s', $title, $start->toDateString(), $end->toDateString());

        $pdf = Pdf::loadView($view, [
            'data'     => $data,
            'fileName' => $fileName,
        ])->setPaper('a4', 'portrait');

        $dir = dirname($report->path_file);
        if (!Storage::disk($disk)->exists($dir)) {
            Storage::disk($disk)->makeDirectory($dir);
        }
        Storage::disk($disk)->put($report->path_file, $pdf->output());
    }
}