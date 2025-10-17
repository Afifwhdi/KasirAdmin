<?php

namespace App\Filament\Resources\Inventories\Schemas;

use App\Models\Product;
use App\Services\InventoryLabelService;
use Filament\Forms;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Forms\Components\Repeater;
use Filament\Schemas\Schema;

class InventoryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\Section::make('Details')
                    ->schema([
                        Forms\Components\ToggleButtons::make('type')
                            ->label('Tipe Stok')
                            ->options(InventoryLabelService::getTypes())
                            ->colors([
                                'in' => 'success',
                                'out' => 'danger',
                                'adjustment' => 'info',
                            ])
                            ->default('in')
                            ->grouped()
                            ->live(),

                        Forms\Components\Select::make('source')
                            ->label('Sumber')
                            ->required()
                            ->options(fn (Forms\Get $get) => InventoryLabelService::getSourceOptionsByType($get('type'))),

                        Forms\Components\TextInput::make('total')
                            ->label('Total Modal')
                            ->prefix('Rp ')
                            ->required()
                            ->numeric()
                            ->readOnly(),
                    ])
                    ->columns(3),

                Forms\Components\Section::make('Pemilihan Produk')
                    ->schema([
                        self::getItemsRepeater(),
                    ]),

                Forms\Components\Section::make('Catatan')
                    ->schema([
                        Forms\Components\Textarea::make('notes')
                            ->maxLength(255)
                            ->columnSpanFull(),
                    ]),
            ]);
    }

    protected static function getItemsRepeater(): Repeater
    {
        return Repeater::make('inventoryItems')
            ->relationship()
            ->live()
            ->columns(['md' => 10])
            ->afterStateUpdated(function (Forms\Get $get, Forms\Set $set) {
                self::updateTotalPrice($get, $set);
            })
            ->schema([
                Forms\Components\Select::make('product_id')
                    ->label('Produk')
                    ->required()
                    ->searchable(['name', 'sku'])
                    ->searchPrompt('Cari nama atau sku produk')
                    ->preload()
                    ->relationship('product', 'name')
                    ->getOptionLabelFromRecordUsing(fn (Product $record) => "{$record->name}-({$record->stock})-{$record->sku}")
                    ->columnSpan(['md' => 4])
                    ->afterStateHydrated(function (Forms\Set $set, Forms\Get $get, $state) {
                        $product = Product::find($state);
                        $set('stock', $product->stock ?? 0);
                    })
                    ->afterStateUpdated(function ($state, Forms\Set $set, Forms\Get $get) {
                        $product = Product::find($state);
                        $set('cost_price', $product->cost_price ?? 0);
                        $set('stock', $product->stock ?? 0);
                        self::updateTotalPrice($get, $set);
                    })
                    ->disableOptionsWhenSelectedInSiblingRepeaterItems(),

                Forms\Components\TextInput::make('cost_price')
                    ->label('Harga Modal')
                    ->required()
                    ->numeric()
                    ->prefix('Rp ')
                    ->readOnly()
                    ->columnSpan(['md' => 2]),

                Forms\Components\TextInput::make('stock')
                    ->label('Stok Saat Ini')
                    ->required()
                    ->numeric()
                    ->readOnly()
                    ->columnSpan(['md' => 2]),

                Forms\Components\TextInput::make('quantity')
                    ->label('Jumlah')
                    ->numeric()
                    ->default(1)
                    ->minValue(1)
                    ->columnSpan(['md' => 2])
                    ->afterStateUpdated(function ($state, Forms\Set $set, Forms\Get $get) {
                        self::updateTotalPrice($get, $set);
                    }),
            ]);
    }

    protected static function updateTotalPrice(Forms\Get $get, Forms\Set $set): void
    {
        $selectedProducts = collect($get('inventoryItems'))->filter(fn ($item) => ! empty($item['product_id']) && ! empty($item['quantity']));

        $prices = Product::find($selectedProducts->pluck('product_id'))->pluck('cost_price', 'id');
        $total = $selectedProducts->reduce(function ($total, $product) use ($prices) {
            return $total + ($prices[$product['product_id']] * $product['quantity']);
        }, 0);

        if ($get('type') !== 'adjustment') {
            $set('total', $total);
        } else {
            $set('total', 0);
        }
    }
}
