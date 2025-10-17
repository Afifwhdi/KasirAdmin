<?php

namespace App\Filament\Resources\ReceiptTemplates;

use App\Filament\Resources\ReceiptTemplates\Pages;
use App\Filament\Resources\ReceiptTemplates\Schemas\ReceiptTemplateForm;
use App\Models\ReceiptTemplate;
use Filament\Actions;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
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
    
    public static function schema(Schema $schema): Schema
    {
        return $schema->schema(ReceiptTemplateForm::schema());
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nama Template')
                    ->searchable()
                    ->sortable(),
                    
                Tables\Columns\TextColumn::make('paper_width')
                    ->label('Lebar Kertas')
                    ->suffix(' mm')
                    ->sortable(),
                    
                Tables\Columns\IconColumn::make('is_default')
                    ->label('Default')
                    ->boolean()
                    ->sortable(),
                    
                Tables\Columns\IconColumn::make('is_active')
                    ->label('Aktif')
                    ->boolean()
                    ->sortable(),
                    
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Dibuat')
                    ->dateTime('d M Y, H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_active')
                    ->label('Status Aktif'),
                Tables\Filters\TernaryFilter::make('is_default')
                    ->label('Template Default'),
            ])
            ->actions([
                Actions\EditAction::make(),
                Actions\DeleteAction::make(),
            ])
            ->bulkActions([
                Actions\BulkActionGroup::make([
                    Actions\DeleteBulkAction::make(),
                ]),
            ]);
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
