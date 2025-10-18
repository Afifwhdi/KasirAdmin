<?php

namespace App\Filament\Resources\ReceiptTemplates;

use App\Filament\Resources\ReceiptTemplates\Pages;
use App\Filament\Resources\ReceiptTemplates\Schemas\ReceiptTemplateForm;
use App\Filament\Resources\ReceiptTemplates\Tables\ReceiptTemplateTable;
use App\Models\ReceiptTemplate;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;

class ReceiptTemplateResource extends Resource
{
    protected static ?string $model = ReceiptTemplate::class;
    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-document-text';
    protected static ?string $navigationLabel = 'Template Struk';
    protected static ?string $modelLabel = 'Template Struk';
    protected static ?string $pluralModelLabel = 'Template Struk';
    protected static string | \UnitEnum | null $navigationGroup = 'Pengaturan';
    protected static ?int $navigationSort = 3;
    
    public static function form(Schema $schema): Schema
    {
        return ReceiptTemplateForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ReceiptTemplateTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListReceiptTemplates::route('/'),
            'create' => Pages\CreateReceiptTemplate::route('/create'),
            'edit' => Pages\EditReceiptTemplate::route('/{record}/edit'),
        ];
    }
}
