<?php

namespace App\Filament\Resources\Products;

use App\Filament\Resources\Products\Pages;
use App\Filament\Resources\Products\Schemas\ProductForm;
use App\Filament\Resources\Products\Tables\ProductsTable;
use App\Models\Product;
use Barryvdh\DomPDF\Facade\Pdf;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Milon\Barcode\DNS1D;

class ProductResource extends Resource
{
    protected static ?string $model = Product::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-cube';
    protected static string| \UnitEnum|null $navigationGroup = 'Menejemen Produk';
    protected static ?string $navigationLabel = 'Produk';
    protected static ?int $navigationSort = 1;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->orderByDesc('created_at');
    }

    public static function form(Schema $schema): Schema
    {
        return ProductForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ProductsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProducts::route('/'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) Product::count();
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'primary';
    }

    public static function getNavigationBadgeTooltip(): ?string
    {
        return 'Jumlah produk';
    }

    /**
     * Generate barcode PDF for multiple products.
     *
     * @param  \Illuminate\Database\Eloquent\Collection  $records
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
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

        $pdf = Pdf::loadView('pdf.barcodes.barcode', compact('barcodes'))
            ->setPaper('a4', 'portrait');

        return response()->streamDownload(
            fn() => print($pdf->output()),
            'barcodes.pdf'
        );
    }
}
