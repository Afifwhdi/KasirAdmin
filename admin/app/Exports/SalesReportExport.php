<?php

namespace App\Exports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
{
    protected $startDate;
    protected $endDate;

    public function __construct($startDate, $endDate)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function collection()
    {
        return Transaction::with(['items.product', 'paymentMethod'])
            ->where('status', 'paid')
            ->whereBetween('created_at', [$this->startDate, $this->endDate])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal',
            'Nomor Invoice',
            'Kasir',
            'Total Items',
            'Subtotal',
            'Diskon',
            'Total',
            'Metode Pembayaran',
            'Status',
        ];
    }

    public function map($transaction): array
    {
        static $no = 1;
        
        return [
            $no++,
            $transaction->created_at->format('d/m/Y H:i'),
            $transaction->invoice_number,
            $transaction->user->name ?? 'N/A',
            $transaction->items->sum('quantity'),
            'Rp ' . number_format($transaction->subtotal, 0, ',', '.'),
            'Rp ' . number_format($transaction->discount ?? 0, 0, ',', '.'),
            'Rp ' . number_format($transaction->total, 0, ',', '.'),
            $transaction->paymentMethod->name ?? 'Cash',
            $transaction->status,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function title(): string
    {
        return 'Laporan Penjualan';
    }
}
