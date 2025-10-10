<?php

namespace App\Filament\Resources\TransactionResource\RelationManagers;

use Filament\Tables;
use Filament\Tables\Table;
use App\Models\TransactionItem;
use Filament\Tables\Columns\Summarizers\Sum;
use Filament\Resources\RelationManagers\RelationManager;

class TransactionItemsRelationManager extends RelationManager
{
    protected static string $relationship = 'transactionItems';
    protected static ?string $title = 'Detail Produk';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('product_name_snapshot')
            ->columns([
                Tables\Columns\ImageColumn::make('productWithTrashed.image')
                    ->label('Gambar')
                    ->square()
                    ->size(60),

                Tables\Columns\TextColumn::make('product_name_snapshot')
                    ->label('Nama Produk')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('quantity')
                    ->label('Jumlah')
                    ->numeric()
                    ->sortable(),

                Tables\Columns\TextColumn::make('price')
                    ->label('Harga Jual')
                    ->prefix('Rp ')
                    ->numeric(),

                Tables\Columns\TextColumn::make('subtotal')
                    ->label('Subtotal')
                    ->prefix('Rp ')
                    ->numeric()
                    ->summarize(
                        Sum::make()
                            ->label('Total Penjualan')
                            ->prefix('Rp ')
                    ),

                Tables\Columns\TextColumn::make('cost_price')
                    ->label('Harga Modal')
                    ->prefix('Rp ')
                    ->numeric(),

                Tables\Columns\TextColumn::make('total_profit')
                    ->label('Profit')
                    ->prefix('Rp ')
                    ->numeric()
                    ->summarize(
                        Sum::make()
                            ->label('Total Profit')
                            ->prefix('Rp ')
                    ),
            ])
            ->filters([])
            ->headerActions([])
            ->actions([])
            ->bulkActions([]);
    }
}
