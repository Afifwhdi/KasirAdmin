<?php

namespace App\Filament\Resources\Products\Schemas;

use Filament\Forms;
use Filament\Schemas\Schema;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\Toggle::make('is_plu_enabled')
                    ->label('Kiloan')
                    ->helperText('Aktifkan jika produk ini menggunakan satuan kiloan untuk penjualan berdasarkan berat.')
                    ->default(false),

                Forms\Components\TextInput::make('name')
                    ->label('Nama Produk')
                    ->required()
                    ->maxLength(255),

                Forms\Components\Select::make('category_id')
                    ->label('Kategori Produk')
                    ->relationship('category', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),

                Forms\Components\TextInput::make('cost_price')
                    ->label('Harga Modal')
                    ->numeric()
                    ->minValue(0)
                    ->required(),

                Forms\Components\TextInput::make('price')
                    ->label('Harga Jual')
                    ->numeric()
                    ->minValue(0)
                    ->required(),

                Forms\Components\FileUpload::make('image')
                    ->label('Gambar')
                    ->image()
                    ->hidden(true),

                Forms\Components\TextInput::make('stock')
                    ->label('Stok')
                    ->numeric()
                    ->minValue(0)
                    ->required(),

                Forms\Components\TextInput::make('min_stock')
                    ->label('Stok Minimum')
                    ->helperText('Alert akan muncul jika stok kurang dari angka ini')
                    ->numeric()
                    ->minValue(1)
                    ->default(10)
                    ->required(),

                Forms\Components\TextInput::make('sku')
                    ->label('SKU')
                    ->disabled()
                    ->hint('Otomatis oleh sistem')
                    ->dehydrated(false),

                Forms\Components\TextInput::make('barcode')
                    ->label('Kode Barcode')
                    ->maxLength(191),

                Forms\Components\Toggle::make('is_active')
                    ->label('Aktif')
                    ->default(true),
            ])
            ->columns(2);
    }
}
