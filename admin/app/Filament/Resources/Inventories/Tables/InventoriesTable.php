<?php

namespace App\Filament\Resources\Inventories\Tables;

use App\Services\InventoryLabelService;
use Filament\Tables;
use Filament\Tables\Table;

class InventoriesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('reference_number')
                    ->label('No.Referensi')
                    ->weight('semibold')
                    ->copyable(),

                Tables\Columns\TextColumn::make('type')
                    ->label('Tipe')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'in' => 'Masuk',
                        'out' => 'Keluar',
                        'adjustment' => 'Penyesuaian',
                    })
                    ->icon(fn (string $state): string => match ($state) {
                        'in' => 'heroicon-o-arrow-down-circle',
                        'out' => 'heroicon-o-arrow-up-circle',
                        'adjustment' => 'heroicon-o-arrow-path-rounded-square',
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'in' => 'success',
                        'out' => 'danger',
                        'adjustment' => 'info',
                    }),

                Tables\Columns\TextColumn::make('source')
                    ->label('Sumber')
                    ->formatStateUsing(fn ($state, $record) => InventoryLabelService::getSourceLabel($record->type, $state)),

                Tables\Columns\TextColumn::make('total')
                    ->numeric()
                    ->prefix('Rp '),

                Tables\Columns\TextColumn::make('notes')
                    ->searchable(),

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
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->emptyStateIcon('heroicon-o-archive-box-x-mark')
            ->emptyStateHeading('Belum ada inventory')
            ->emptyStateDescription('Semua invontory yang kamu input akan tampil di sini.')
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
    }
}
