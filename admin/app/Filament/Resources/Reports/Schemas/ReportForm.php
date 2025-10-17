<?php

namespace App\Filament\Resources\Reports\Schemas;

use Filament\Forms;
use Filament\Schemas\Schema;

class ReportForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\Section::make('Setting Laporan')
                    ->schema([
                        Forms\Components\ToggleButtons::make('report_type')
                            ->options([
                                'inflow' => 'Uang Masuk',
                                'outflow' => 'Uang Keluar',
                                'sales' => 'Penjualan',
                            ])
                            ->colors([
                                'inflow' => 'success',
                                'outflow' => 'danger',
                                'sales' => 'info',
                            ])
                            ->default('inflow')
                            ->grouped(),

                        Forms\Components\DatePicker::make('start_date')
                            ->label('Dari Tanggal')
                            ->required(),

                        Forms\Components\DatePicker::make('end_date')
                            ->label('Sampai Tanggal')
                            ->required(),
                    ]),
            ]);
    }
}
