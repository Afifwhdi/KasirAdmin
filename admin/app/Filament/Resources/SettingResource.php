<?php

namespace App\Filament\Resources;

use Filament\Forms;
use Filament\Tables;
use App\Models\Setting;
use Filament\Forms\Get;
use Filament\Forms\Form;
use Filament\Tables\Table;
use Filament\Resources\Resource;
use App\Filament\Resources\SettingResource\Pages;

class SettingResource extends Resource
{

    protected static ?string $model = Setting::class;

    protected static ?string $navigationIcon = 'heroicon-o-printer';

    protected static ?string $navigationLabel = 'Pengaturan';

    protected static ?int $navigationSort = 8;

    protected static ?string $navigationGroup = 'Pengaturan Toko';

    public static function form(Form $form): Form
    {
        return $form
            ->schema([
                Forms\Components\Section::make('Profil Toko')
                ->schema([
                Forms\Components\TextInput::make('name')
                    ->required()
                    ->maxLength(255)
                    ->label('Nama Toko'),
                Forms\Components\TextInput::make('address')
                    ->required()
                    ->maxLength(255)
                    ->label('Alamat Toko'),
                Forms\Components\TextInput::make('phone')
                    ->tel()
                    ->required()
                    ->maxLength(255)
                    ->label('Nomor Telepon'),
                ]),
                Forms\Components\Section::make('Setting Printer')
                ->schema([
                Forms\Components\ToggleButtons::make('print_via_bluetooth')
                    ->required()
                    ->label('Tipe Print')
                    ->options([
                        0 => 'Lokal (USB/Kabel/Network)',
                        1 => 'Bluetooth (Belum Paired)'
                    ])
                    ->grouped()
                    ->helperText('Pilih "Lokal" jika printer sudah terhubung di Windows (USB/Bluetooth paired). Pilih "Bluetooth" hanya jika ingin pair printer baru.')
                    ->live(),
                Forms\Components\TextInput::make('name_printer_local')
                    ->maxLength(255)
                    ->label('Nama Printer')
                    ->helperText('Masukkan nama printer yang muncul di "Printers & Scanners" Windows. Contoh: "Epson TM-T20II", "POS-80", "Bluetooth Printer". Untuk printer Bluetooth yang sudah paired, cek nama di Settings Windows → Printers & Scanners.')
                    ->placeholder('Contoh: Epson TM-T20II'),
                Forms\Components\FileUpload::make('logo')
                    ->image()
                    ->required()
                    ->helperText('Pastikan format gambar adalah PNG')
                    ->directory('images')
                    ->label('Logo Toko'),
                ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('logo')
                    ->circular()
                    ->label('Logo Toko'),
                Tables\Columns\TextColumn::make('name')
                    ->label('Nama Toko')
                    ->searchable(),
                Tables\Columns\TextColumn::make('address')
                    ->label('Alamat Toko')
                    ->searchable(),
                Tables\Columns\TextColumn::make('phone')
                    ->label('Nomor Telepon')
                    ->searchable(),
                Tables\Columns\IconColumn::make('print_via_bluetooth')
                    ->label('Print Via Bluetooth')
                    ->boolean(),
                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                Tables\Columns\TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->bulkActions([
                Tables\Actions\BulkActionGroup::make([
                    Tables\Actions\DeleteBulkAction::make(),
                ]),
            ]);
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
            'index' => Pages\ListSettings::route('/'),
        ];
    }

    public static function canCreate(): bool
    {
        return Setting::count() < 1;
    }
}
