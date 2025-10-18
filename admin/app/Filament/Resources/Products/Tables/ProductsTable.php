<?php

namespace App\Filament\Resources\Products\Tables;

use Filament\Actions\Action;
use Filament\Actions\BulkAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ProductsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Nama')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('category.name')
                    ->label('Kategori')
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('stock')
                    ->label('Stok')
                    ->sortable()
                    ->toggleable()
                    ->formatStateUsing(fn($state) => (int) $state)
                    ->color(fn($record) => $record->stock <= $record->min_stock ? 'danger' : 'success')
                    ->badge(),

                TextColumn::make('min_stock')
                    ->label('Min. Stok')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->formatStateUsing(fn($state) => (int) $state),

                TextColumn::make('cost_price')
                    ->label('Modal')
                    ->money('idr', true)
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('price')
                    ->label('Harga')
                    ->money('idr', true)
                    ->sortable()
                    ->toggleable(),

                TextColumn::make('barcode')
                    ->label('Barcode')
                    ->searchable()
                    ->toggleable(),

                TextColumn::make('sku')
                    ->label('SKU')
                    ->searchable()
                    ->toggleable(),

                TextColumn::make('created_at')
                    ->label('Dibuat')
                    ->dateTime()
                    ->since()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                EditAction::make()
                    ->label('Edit')
                    ->modalWidth('5xl'),

                DeleteAction::make()
                    ->label('Hapus'),

                Action::make('printBarcodes')
                    ->label('Cetak Barcode')
                    ->icon('heroicon-o-printer')
                    ->hidden(true),
            ])
            ->bulkActions([
                DeleteBulkAction::make()
                    ->label('Hapus Terpilih'),

                BulkAction::make('generateBarcodePdf')
                    ->label('Cetak Barcode (Bulk)')
                    ->hidden(true),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
