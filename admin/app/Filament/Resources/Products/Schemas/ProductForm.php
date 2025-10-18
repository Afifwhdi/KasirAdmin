<?php

namespace App\Filament\Resources\Products\Schemas;

use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Toggle::make('is_plu_enabled')
                    ->label('Produk Kiloan')
                    ->helperText('Aktifkan untuk produk yang dijual per kg')
                    ->default(false)
                    ->inline(false),

                Toggle::make('is_active')
                    ->label('Status Aktif')
                    ->default(true)
                    ->inline(false),

                Section::make('Informasi Produk')
                    ->schema([
                        TextInput::make('name')
                            ->label('Nama Produk')
                            ->required()
                            ->maxLength(255)
                            ->columnSpanFull(),

                        Select::make('category_id')
                            ->label('Kategori')
                            ->relationship('category', 'name')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->columnSpanFull(),

                        TextInput::make('barcode')
                            ->label('Barcode')
                            ->maxLength(191)
                            ->placeholder('Opsional')
                            ->columnSpanFull(),

                        TextInput::make('Sku')
                            ->label('Sku')
                            ->disabled()
                            ->placeholder('Terisi Otomatis')
                            ->columnSpanFull(),
                    ])
                    ->columns(1),

                Section::make('Harga')
                    ->schema([
                        TextInput::make('cost_price')
                            ->label('Harga Modal')
                            ->numeric()
                            ->prefix('Rp')
                            ->minValue(0)
                            ->required()
                            ->columnSpanFull(),

                        TextInput::make('price')
                            ->label('Harga Jual')
                            ->numeric()
                            ->prefix('Rp')
                            ->minValue(0)
                            ->required()
                            ->columnSpanFull(),

                        TextInput::make('stock')
                            ->label('Stok Awal')
                            ->numeric()
                            ->minValue(0)
                            ->default(0)
                            ->required()
                            ->columnSpanFull(),

                        TextInput::make('min_stock')
                            ->label('Stok Minimum')
                            ->numeric()
                            ->minValue(1)
                            ->default(5)
                            ->required()
                            ->columnSpanFull(),
                    ])
                    ->columns(1),
            ]);
    }
}
