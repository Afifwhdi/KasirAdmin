<?php

namespace App\Filament\Pages;

use App\Exports\ProductReportExport;
use App\Exports\SalesReportExport;
use App\Filament\Widgets\SalesReportsStatsWidget;
use Carbon\Carbon;
use Filament\Actions\Action;
use Filament\Forms\Components\DatePicker;
use Filament\Schemas\Components\Section;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Schemas\Schema;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Filament\Pages\Dashboard\Concerns\HasFiltersForm;
use Maatwebsite\Excel\Facades\Excel;

class SalesReports extends Page implements HasForms
{
    use InteractsWithForms;
    use HasFiltersForm;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-document-chart-bar';
    protected static ?string $navigationLabel = 'Laporan Analytics';
    protected static ?string $title = 'Laporan Penjualan & Analytics';
    protected static string | \UnitEnum | null $navigationGroup = 'Menejemen keuangan';
    protected static ?int $navigationSort = 7;

    public ?array $data = [];
    public $startDate;
    public $endDate;

    public function mount(): void
    {
        $this->startDate = Carbon::today()->toDateString();
        $this->endDate = Carbon::today()->toDateString();
        $this->form->fill([
            'startDate' => $this->startDate,
            'endDate' => $this->endDate,
        ]);
    }
    
    public function getView(): string
    {
        return 'filament.pages.sales-reports';
    }

    public function filtersForm(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Section::make('Filter Periode')
                    ->schema([
                        DatePicker::make('startDate')
                            ->label('Dari')
                            ->default(Carbon::today())
                            ->maxDate(now())
                            ->required()
                            ->live(),
                        DatePicker::make('endDate')
                            ->label('Sampai')
                            ->default(Carbon::today())
                            ->maxDate(now())
                            ->required()
                            ->afterOrEqual('startDate')
                            ->live(),
                    ])
                    ->columns(2)
                    ->aside(),
            ])
            ->statePath('data');
    }

    public function getWidgets(): array
    {
        return [
            SalesReportsStatsWidget::class,
        ];
    }

    protected function getHeaderWidgets(): array
    {
        return [
            SalesReportsStatsWidget::class,
        ];
    }

    public function getHeaderWidgetsColumns(): int | array
    {
        return 3;
    }

    protected function getHeaderActions(): array
    {
        return [
            Action::make('exportSales')
                ->label('Export Transaksi')
                ->icon('heroicon-o-arrow-down-tray')
                ->color('success')
                ->action(function () {
                    $start = Carbon::parse($this->filters['startDate'] ?? Carbon::today());
                    $end = Carbon::parse($this->filters['endDate'] ?? Carbon::today());
                    
                    Notification::make()
                        ->title('Laporan sedang diunduh')
                        ->success()
                        ->send();
                    
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
                    $start = Carbon::parse($this->filters['startDate'] ?? Carbon::today());
                    $end = Carbon::parse($this->filters['endDate'] ?? Carbon::today());
                    
                    Notification::make()
                        ->title('Laporan sedang diunduh')
                        ->success()
                        ->send();
                    
                    return Excel::download(
                        new ProductReportExport($start, $end),
                        'laporan-produk-' . $start->format('Ymd') . '-' . $end->format('Ymd') . '.xlsx'
                    );
                }),
        ];
    }
}
