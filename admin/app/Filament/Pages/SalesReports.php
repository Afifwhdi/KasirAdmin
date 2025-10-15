<?php

namespace App\Filament\Pages;

use App\Exports\ProductReportExport;
use App\Exports\SalesReportExport;
use App\Models\Transaction;
use Carbon\Carbon;
use Filament\Actions\Action;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Section;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Forms\Form;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Maatwebsite\Excel\Facades\Excel;

class SalesReports extends Page implements HasForms
{
    use InteractsWithForms;

    protected static ?string $navigationIcon = 'heroicon-o-document-chart-bar';
    protected static ?string $navigationLabel = 'Laporan Analytics';
    protected static ?string $title = 'Laporan Penjualan & Analytics';
    protected static ?string $navigationGroup = 'Menejemen keuangan';
    protected static ?int $navigationSort = 7;

    protected static string $view = 'filament.pages.sales-reports';

    public ?array $data = [];
    public $startDate;
    public $endDate;
    public $stats = [];

    public function mount(): void
    {
        $this->startDate = Carbon::today()->toDateString();
        $this->endDate = Carbon::today()->toDateString();
        $this->loadStats();
        $this->form->fill();
    }

    public function form(Form $form): Form
    {
        return $form
            ->schema([
                Section::make('Filter Periode')
                    ->schema([
                        DatePicker::make('startDate')
                            ->label('Dari Tanggal')
                            ->default(Carbon::today())
                            ->required(),
                        DatePicker::make('endDate')
                            ->label('Sampai Tanggal')
                            ->default(Carbon::today())
                            ->required()
                            ->afterOrEqual('startDate'),
                    ])
                    ->columns(2),
            ])
            ->statePath('data');
    }

    public function loadStats(): void
    {
        $start = Carbon::parse($this->startDate)->startOfDay();
        $end = Carbon::parse($this->endDate)->endOfDay();

        $transactions = Transaction::with('items.product')
            ->where('status', 'paid')
            ->whereBetween('created_at', [$start, $end])
            ->get();

        $totalRevenue = 0;
        $totalCost = 0;
        $totalItems = 0;

        foreach ($transactions as $transaction) {
            $totalRevenue += $transaction->total;
            foreach ($transaction->items as $item) {
                $totalCost += ($item->product->cost_price ?? 0) * $item->quantity;
                $totalItems += $item->quantity;
            }
        }

        $this->stats = [
            'transactions' => $transactions->count(),
            'revenue' => $totalRevenue,
            'cost' => $totalCost,
            'profit' => $totalRevenue - $totalCost,
            'items' => $totalItems,
            'avg_transaction' => $transactions->count() > 0 ? $totalRevenue / $transactions->count() : 0,
        ];
    }

    public function applyFilter(): void
    {
        $this->loadStats();
        Notification::make()
            ->title('Filter diterapkan')
            ->success()
            ->send();
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('exportSales')
                ->label('Export Transaksi')
                ->icon('heroicon-o-arrow-down-tray')
                ->color('success')
                ->action(function () {
                    $start = Carbon::parse($this->startDate);
                    $end = Carbon::parse($this->endDate);
                    
                    return Excel::download(
                        new SalesReportExport($start, $end),
                        'laporan-penjualan-' . $start->format('Ymd') . '-' . $end->format('Ymd') . '.xlsx'
                    );
                }),

            Action::make('exportProducts')
                ->label('Export Produk')
                ->icon('heroicon-o-arrow-down-tray')
                ->color('info')
                ->action(function () {
                    $start = Carbon::parse($this->startDate);
                    $end = Carbon::parse($this->endDate);
                    
                    return Excel::download(
                        new ProductReportExport($start, $end),
                        'laporan-produk-' . $start->format('Ymd') . '-' . $end->format('Ymd') . '.xlsx'
                    );
                }),
        ];
    }
}
