<?php

namespace App\Filament\Resources\Inventories;

use App\Filament\Resources\Inventories\Pages;
use App\Filament\Resources\Inventories\Schemas\InventoryForm;
use App\Filament\Resources\Inventories\Tables\InventoriesTable;
use App\Models\Inventory;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;

class InventoryResource extends Resource
{
    protected static ?string $model = Inventory::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-squares-plus';

    protected static ?string $navigationLabel = 'Menejemen Inventori';

    protected static ?int $navigationSort = 3;

    protected static string | \UnitEnum | null $navigationGroup = 'Menejemen Produk';

    public static function getNavigationBadge(): ?string
    {
        return (string) Inventory::count();
    }

    public static function form(Schema $schema): Schema
    {
        return InventoryForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return InventoriesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListInventories::route('/'),
        ];
    }
}
