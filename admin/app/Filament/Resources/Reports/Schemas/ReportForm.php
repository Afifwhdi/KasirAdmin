<?php

namespace App\Filament\Resources\Reports\Schemas;

use Filament\Forms;
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
                        Forms\Components\DatePicker::make('start_date')
                            ->label('Dari Tanggal')
                            ->required()
                            ->maxDate(now())
                            ->default(now()->startOfMonth()),

                        Forms\Components\DatePicker::make('end_date')
                            ->label('Sampai Tanggal')
                            ->required()
                            ->maxDate(now())
                            ->default(now()),
                    ])
                    ->columns(2),
            ]);
    }
}
