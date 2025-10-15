<?php

namespace App\Filament\Widgets;

use App\Models\Product;
use App\Models\TransactionItem;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Database\Eloquent\Builder;

class BestSellingProducts extends BaseWidget
{
    protected static ?int $sort = 5;
    protected static ?string $heading = 'Produk Terlaris';
    protected int | string | array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Product::query()
                    ->select('products.*')
                    ->selectRaw('COALESCE(SUM(transaction_items.quantity), 0) as total_sold')
                    ->selectRaw('COALESCE(SUM(transaction_items.quantity * transaction_items.price), 0) as total_revenue')
                    ->leftJoin('transaction_items', 'products.id', '=', 'transaction_items.product_id')
                    ->leftJoin('transactions', 'transaction_items.transaction_id', '=', 'transactions.id')
                    ->where(function($query) {
                        $query->where('transactions.status', 'paid')
                              ->orWhereNull('transactions.status');
                    })
                    ->groupBy('products.id')
                    ->orderByDesc('total_sold')
                    ->limit(10)
            )
            ->columns([
                Tables\Columns\TextColumn::make('rank')
                    ->label('#')
                    ->rowIndex(),

                Tables\Columns\TextColumn::make('name')
                    ->label('Nama Produk')
                    ->searchable()
                    ->weight('semibold'),

                Tables\Columns\TextColumn::make('category.name')
                    ->label('Kategori')
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('total_sold')
                    ->label('Terjual')
                    ->sortable()
                    ->badge()
                    ->color('success')
                    ->formatStateUsing(fn ($state) => number_format($state, 0, ',', '.') . ' unit'),

                Tables\Columns\TextColumn::make('total_revenue')
                    ->label('Total Pendapatan')
                    ->sortable()
                    ->money('IDR', true)
                    ->color('primary'),

                Tables\Columns\TextColumn::make('stock')
                    ->label('Stok Tersisa')
                    ->sortable()
                    ->badge()
                    ->color(fn ($record) => $record->stock <= $record->min_stock ? 'danger' : 'success')
                    ->formatStateUsing(fn ($state) => (int) $state),
            ])
            ->defaultPaginationPageOption(10)
            ->paginated([10, 25, 50])
            ->poll('30s');
    }
}
