<?php

namespace App\Filament\Resources\Products\Tables;

use Filament\Actions;
use Filament\Tables;
use Filament\Tables\Table;

class ProductsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nama')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('category.name')
                    ->label('Kategori')
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('stock')
                    ->label('Stok')
                    ->sortable()
                    ->toggleable()
                    ->formatStateUsing(fn ($state) => (int) $state)
                    ->color(fn ($record) => $record->stock <= $record->min_stock ? 'danger' : 'success')
                    ->badge(),

                Tables\Columns\TextColumn::make('min_stock')
                    ->label('Min. Stok')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->formatStateUsing(fn ($state) => (int) $state),

                Tables\Columns\TextColumn::make('cost_price')
                    ->label('Modal')
                    ->money('idr', true)
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('price')
                    ->label('Harga')
                    ->money('idr', true)
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('barcode')
                    ->label('Barcode')
                    ->searchable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('sku')
                    ->label('SKU')
                    ->searchable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Dibuat')
                    ->dateTime()
                    ->since()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                Actions\EditAction::make()
                    ->label('Edit')
                    ->modalWidth('5xl'),
                Actions\DeleteAction::make()->label('Hapus'),

                Actions\Action::make('printBarcodes')
                    ->label('Cetak Barcode')
                    ->icon('heroicon-o-printer')
                    ->hidden(true),
            ])
            ->bulkActions([
                Actions\DeleteBulkAction::make()->label('Hapus Terpilih'),

                Actions\BulkAction::make('generateBarcodePdf')
                    ->label('Cetak Barcode (Bulk)')
                    ->hidden(true),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
