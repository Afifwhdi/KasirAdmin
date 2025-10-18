<?php

namespace App\Filament\Resources\Reports\Tables;

use App\Models\Report;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ReportsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Nama/Kode Laporan')
                    ->weight('semibold')
                    ->searchable(),

                TextColumn::make('report_type')
                    ->label('Tipe Laporan')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'inflow' => 'Uang Masuk',
                        'outflow' => 'Uang Keluar',
                        'sales' => 'Penjualan',
                        default => 'Unknown',
                    })
                    ->icon(fn (string $state): string => match ($state) {
                        'inflow' => 'heroicon-o-arrow-down-circle',
                        'outflow' => 'heroicon-o-arrow-up-circle',
                        'sales' => 'heroicon-o-arrow-down-circle',
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'inflow' => 'success',
                        'outflow' => 'danger',
                        'sales' => 'info',
                        default => 'gray',
                    }),

                TextColumn::make('start_date')
                    ->label('Dari Tanggal')
                    ->date()
                    ->sortable(),

                TextColumn::make('end_date')
                    ->label('Sampai Tanggal')
                    ->date()
                    ->sortable(),

                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->filters([])
            ->actions([
                Action::make('download')
                    ->label('Download')
                    ->icon('heroicon-m-arrow-down-tray')
                    ->color('primary')
                    ->url(fn (Report $record) => route('reports.download', $record))
                    ->visible(fn () => true),

                EditAction::make(),
            ])
            ->emptyStateIcon('heroicon-o-banknotes')
            ->emptyStateHeading('Belum ada laporan keuangan')
            ->emptyStateDescription('Semua laporan keuangan yang kamu input akan tampil di sini.')
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
