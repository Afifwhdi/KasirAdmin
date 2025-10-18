<?php

namespace App\Filament\Resources\Reports\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ReportForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Section::make('Laporan Penjualan')
                    ->description('Generate laporan penjualan berdasarkan rentang tanggal')
                    ->schema([
                        DatePicker::make('start_date')
                            ->label('Dari Tanggal')
                            ->required()
                            ->maxDate(now())
                            ->default(now()->startOfMonth()),

                        DatePicker::make('end_date')
                            ->label('Sampai Tanggal')
                            ->required()
                            ->maxDate(now())
                            ->default(now()),
                    ])
                    ->columns(2),
            ]);
    }
}
