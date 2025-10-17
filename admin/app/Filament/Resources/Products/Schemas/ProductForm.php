<?php

namespace App\Filament\Resources\Products\Schemas;

use Filament\Forms;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Section::make('Informasi Produk')
                    ->schema([
                        Forms\Components\TextInput::make('name')
                            ->label('Nama Produk')
                            ->required()
                            ->maxLength(255),

                        Forms\Components\Select::make('category_id')
                            ->label('Kategori')
                            ->relationship('category', 'name')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->createOptionForm([
                                Forms\Components\TextInput::make('name')
                                    ->label('Nama Kategori')
                                    ->required(),
                            ]),

                        Forms\Components\TextInput::make('barcode')
                            ->label('Barcode')
                            ->maxLength(191)
                            ->placeholder('Opsional'),

                        Forms\Components\Toggle::make('is_plu_enabled')
                            ->label('Produk Kiloan')
                            ->helperText('Aktifkan untuk produk yang dijual per kg')
                            ->default(false)
                            ->inline(false),

                        Forms\Components\Toggle::make('is_active')
                            ->label('Status Aktif')
                            ->default(true)
                            ->inline(false),
                    ])
                    ->columns(1),

                Section::make('Harga')
                    ->schema([
                        Forms\Components\TextInput::make('cost_price')
                            ->label('Harga Modal')
                            ->numeric()
                            ->prefix('Rp')
                            ->minValue(0)
                            ->required(),

                        Forms\Components\TextInput::make('price')
                            ->label('Harga Jual')
                            ->numeric()
                            ->prefix('Rp')
                            ->minValue(0)
                            ->required(),
                    ])
                    ->columns(1),

                Section::make('Stok')
                    ->schema([
                        Forms\Components\TextInput::make('stock')
                            ->label('Stok Awal')
                            ->numeric()
                            ->minValue(0)
                            ->default(0)
                            ->required(),

                        Forms\Components\TextInput::make('min_stock')
                            ->label('Stok Minimum')
                            ->helperText('Peringatan muncul jika stok dibawah angka ini')
                            ->numeric()
                            ->minValue(1)
                            ->default(5)
                            ->required(),
                    ])
                    ->columns(1),
            ]);
    }
}
