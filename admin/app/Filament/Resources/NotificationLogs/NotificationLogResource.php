<?php

namespace App\Filament\Resources\NotificationLogs;

use App\Filament\Resources\NotificationLogs\Pages\ListNotificationLogs;
use App\Filament\Resources\NotificationLogs\Schemas\NotificationLogForm;
use App\Filament\Resources\NotificationLogs\Tables\NotificationLogsTable;
use App\Models\NotificationLog;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class NotificationLogResource extends Resource
{
    protected static ?string $model = NotificationLog::class;

    protected static string | \BackedEnum| null $navigationIcon = Heroicon::OutlinedDocumentText;
    protected static string | \UnitEnum | null $navigationGroup = 'Pengaturan Toko';
    protected static ?string $navigationLabel = 'Log Notifikasi';
    protected static ?string $modelLabel = 'Log Notifikasi';
    protected static ?string $pluralModelLabel = 'Log Notifikasi';
    protected static ?int $navigationSort = 99;

    public static function canCreate(): bool
    {
        return false;
    }

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return NotificationLogForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return NotificationLogsTable::configure($table);
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
            'index' => ListNotificationLogs::route('/'),
        ];
    }
}
