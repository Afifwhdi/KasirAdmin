<?php

namespace App\Filament\Resources\Categories;

use App\Filament\Resources\Categories\Pages;
use App\Filament\Resources\Categories\RelationManagers;
use App\Filament\Resources\Categories\Schemas\CategoryForm;
use App\Filament\Resources\Categories\Tables\CategoriesTable;
use App\Models\Category;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class CategoryResource extends Resource
{
    protected static ?string $model = Category::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-tag';
    protected static string| \UnitEnum|null $navigationGroup = 'Menejemen Produk';
    protected static ?string $navigationLabel = 'Kategori';
    protected static ?int $navigationSort = 1;

    public static function getNavigationBadge(): ?string
    {
        return (string) Category::count();
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->orderBy('created_at', 'desc');
    }

    public static function form(Schema $schema): Schema
    {
        return CategoryForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CategoriesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            RelationManagers\ProductsRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCategories::route('/'),
        ];
    }
}
