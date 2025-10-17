<?php

namespace App\Filament\Pages;

use Filament\Forms\Components\DatePicker;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Select;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;
use Filament\Pages\Dashboard as BaseDashboard;
use Filament\Pages\Dashboard\Concerns\HasFiltersForm;
use App\Filament\Widgets;

class Dashboard extends BaseDashboard
{
    use HasFiltersForm;
    
    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-chart-pie';

    public function filtersForm(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Section::make()
                    ->schema([
                        Select::make('range')
                            ->label('Rentang Waktu')
                            ->options([
                                'today' => 'Hari Ini',
                                'yesterday' => 'Kemarin',
                                'this_week' => 'Minggu Ini',
                                'this_month' => 'Bulan Ini',
                                'custom' => 'Custom',
                            ])
                            ->default('today')
                            ->live()
                            ->columnSpan(2),

                        DatePicker::make('startDate')
                            ->label('Dari')
                            ->visible(fn(Get $get) => $get('range') === 'custom')
                            ->default(now())
                            ->maxDate(now())
                            ->live()
                            ->columnSpan(1),

                        DatePicker::make('endDate')
                            ->label('Sampai')
                            ->visible(fn(Get $get) => $get('range') === 'custom')
                            ->default(now())
                            ->minDate(fn(Get $get) => $get('startDate') ?: now())
                            ->maxDate(now())
                            ->live()
                            ->columnSpan(1),
                    ])
                    ->columns(4),
            ]);
    }
    
    public function getWidgets(): array
    {
        return [
            Widgets\StatsOverview::class,
            Widgets\TotalStatsOverview::class,
            Widgets\LowStockAlert::class,
            Widgets\BundlingSuggestions::class,
        ];
    }
}
