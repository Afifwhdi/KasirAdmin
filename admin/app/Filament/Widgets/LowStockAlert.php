<?php

namespace App\Filament\Widgets;

use App\Models\Product;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class LowStockAlert extends BaseWidget
{
    protected static ?int $sort = 3;
    protected int | string | array $columnSpan = 'full';
    
    protected function getTableHeading(): string
    {
        return '⚠️ Peringatan Stok Rendah';
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Product::query()
                    ->whereColumn('stock', '<=', 'min_stock')
                    ->where('is_active', true)
                    ->orderBy('stock', 'asc')
            )
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nama Produk')
                    ->searchable()
                    ->sortable(),
                    
                Tables\Columns\TextColumn::make('category.name')
                    ->label('Kategori')
                    ->badge()
                    ->color('info'),
                    
                Tables\Columns\TextColumn::make('stock')
                    ->label('Stok Saat Ini')
                    ->badge()
                    ->color('danger'),
                    
                Tables\Columns\TextColumn::make('min_stock')
                    ->label('Stok Minimum')
                    ->badge()
                    ->color('warning'),
                    
                Tables\Columns\TextColumn::make('stock_status')
                    ->label('Status')
                    ->badge()
                    ->state(function (Product $record): string {
                        if ($record->stock == 0) {
                            return 'Habis';
                        } elseif ($record->stock < $record->min_stock / 2) {
                            return 'Kritis';
                        }
                        return 'Rendah';
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'Habis' => 'danger',
                        'Kritis' => 'warning',
                        default => 'gray',
                    }),
            ])
            ->paginated([5, 10])
            ->defaultPaginationPageOption(5)
            ->poll('30s');
    }
}
