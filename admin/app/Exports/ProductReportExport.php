<?php

namespace App\Exports;

use App\Models\Product;
use App\Models\TransactionItem;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Facades\DB;

class ProductReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithTitle
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
        return Product::query()
            ->select('products.*')
            ->selectRaw('COALESCE(SUM(transaction_items.quantity), 0) as total_sold')
            ->selectRaw('COALESCE(SUM(transaction_items.quantity * transaction_items.price), 0) as total_revenue')
            ->selectRaw('COALESCE(SUM(transaction_items.quantity * products.cost_price), 0) as total_cost')
            ->leftJoin('transaction_items', 'products.id', '=', 'transaction_items.product_id')
            ->leftJoin('transactions', function ($join) {
                $join->on('transaction_items.transaction_id', '=', 'transactions.id')
                    ->where('transactions.status', 'paid')
                    ->whereBetween('transactions.created_at', [$this->startDate, $this->endDate]);
            })
            ->with('category')
            ->groupBy('products.id')
            ->orderByDesc('total_sold')
            ->get();
    }

    public function headings(): array
    {
        return [
            'No',
            'SKU',
            'Nama Produk',
            'Kategori',
            'Harga Modal',
            'Harga Jual',
            'Stok Saat Ini',
            'Min. Stok',
            'Terjual',
            'Total Pendapatan',
            'Total Modal',
            'Profit',
            'Margin %',
        ];
    }

    public function map($product): array
    {
        static $no = 1;
        
        $profit = $product->total_revenue - $product->total_cost;
        $margin = $product->total_revenue > 0 
            ? (($profit / $product->total_revenue) * 100) 
            : 0;

        return [
            $no++,
            $product->sku,
            $product->name,
            $product->category->name ?? 'N/A',
            'Rp ' . number_format($product->cost_price, 0, ',', '.'),
            'Rp ' . number_format($product->price, 0, ',', '.'),
            $product->stock,
            $product->min_stock,
            number_format($product->total_sold, 0, ',', '.'),
            'Rp ' . number_format($product->total_revenue, 0, ',', '.'),
            'Rp ' . number_format($product->total_cost, 0, ',', '.'),
            'Rp ' . number_format($profit, 0, ',', '.'),
            number_format($margin, 2, ',', '.') . '%',
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
        return 'Laporan Produk';
    }
}
