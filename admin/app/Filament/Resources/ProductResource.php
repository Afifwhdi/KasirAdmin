<?php

namespace App\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use App\Models\Product;
use App\Models\Category;
use Filament\Forms\Form;
use Milon\Barcode\DNS1D;
use Filament\Tables\Table;
use Filament\Actions\Action;
use Barryvdh\DomPDF\Facade\Pdf;
use Filament\Resources\Resource;
use Illuminate\Database\Eloquent\Builder;
use App\Filament\Resources\ProductResource\Pages;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static ?string $navigationIcon = 'heroicon-o-cube';
    protected static ?string $navigationGroup = 'Master Data';
    protected static ?string $navigationLabel = 'Produk';

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->orderByDesc('created_at');
    }

    public static function form(Form $form): Form
    {
        return $form
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
            ])->columns(2);
    }

    public static function table(Table $table): Table
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
                    Tables\Actions\EditAction::make()->label('Edit'),
                    Tables\Actions\DeleteAction::make()->label('Hapus'),

                Tables\Actions\Action::make('printBarcodes')
                    ->label('Cetak Barcode')
                    ->icon('heroicon-o-printer')
                    ->hidden(true),
                    
            ])
            ->bulkActions([
                Tables\Actions\DeleteBulkAction::make()->label('Hapus Terpilih'),

                Tables\Actions\BulkAction::make('generateBarcodePdf')
                    ->label('Cetak Barcode (Bulk)')
                    ->hidden(true),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getRelations(): array
    {
        return [
            
        ];
    }

    public static function getPages(): array
    {
        return [
            'index'  => Pages\ListProducts::route('/'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) \App\Models\Product::count();
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'primary'; 
    }

    public static function getNavigationBadgeTooltip(): ?string
    {
        return 'Jumlah produk';
    }

    protected static function generateBulkBarcode($records)
    {
        $barcodes = [];
        $barcodeGenerator = new DNS1D();

        foreach ($records as $product) {
            $barcodes[] = [
                'name' => $product->name,
                'price' => $product->price,
                'barcode' => 'data:image/png;base64,' . $barcodeGenerator->getBarcodePNG($product->barcode, 'C128'),
                'number' => $product->barcode,
            ];
        }

        $pdf = Pdf::loadView('pdf.barcodes.barcode', compact('barcodes'))->setPaper('a4', 'portrait');
        return response()->streamDownload(fn() => print($pdf->output()), 'barcodes.pdf');
    }
}
