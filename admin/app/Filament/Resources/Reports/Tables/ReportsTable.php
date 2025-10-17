<?php

namespace App\Filament\Resources\Reports\Tables;

use App\Models\Report;
use Filament\Tables;
use Filament\Tables\Actions\Action;
use Filament\Tables\Table;

class ReportsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nama/Kode Laporan')
                    ->weight('semibold')
                    ->searchable(),

                Tables\Columns\TextColumn::make('report_type')
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

                Tables\Columns\TextColumn::make('start_date')
                    ->label('Dari Tanggal')
                    ->date()
                    ->sortable(),

                Tables\Columns\TextColumn::make('end_date')
                    ->label('Sampai Tanggal')
                    ->date()
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                Tables\Columns\TextColumn::make('updated_at')
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

                Tables\Actions\EditAction::make(),
            ])
            ->emptyStateIcon('heroicon-o-banknotes')
            ->emptyStateHeading('Belum ada laporan keuangan')
            ->emptyStateDescription('Semua laporan keuangan yang kamu input akan tampil di sini.')
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
