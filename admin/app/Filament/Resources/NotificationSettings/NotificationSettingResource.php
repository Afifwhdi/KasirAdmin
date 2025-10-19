<?php

namespace App\Filament\Resources\NotificationSettings;

use App\Filament\Resources\NotificationSettings\Pages\CreateNotificationSetting;
use App\Filament\Resources\NotificationSettings\Pages\EditNotificationSetting;
use App\Filament\Resources\NotificationSettings\Pages\ListNotificationSettings;
use App\Filament\Resources\NotificationSettings\Schemas\NotificationSettingForm;
use App\Filament\Resources\NotificationSettings\Tables\NotificationSettingsTable;
use App\Models\NotificationSetting;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

class NotificationSettingResource extends Resource
{
    protected static ?string $model = NotificationSetting::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBell;

    protected static UnitEnum|string|null $navigationGroup = 'Pengaturan';

    protected static ?string $navigationLabel = 'Notifikasi WhatsApp';

    protected static ?string $modelLabel = 'Pengaturan Notifikasi';

    protected static ?string $pluralModelLabel = 'Pengaturan Notifikasi';


    public static function form(Schema $schema): Schema
    {
        return NotificationSettingForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return NotificationSettingsTable::configure($table);
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
            'index' => ListNotificationSettings::route('/'),
            // 'create' => CreateNotificationSetting::route('/create'),
            // 'edit' => EditNotificationSetting::route('/{record}/edit'),
        ];
    }
}
