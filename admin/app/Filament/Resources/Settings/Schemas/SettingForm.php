<?php

namespace App\Filament\Resources\Settings\Schemas;

use Filament\Forms;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SettingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Section::make('Profil Toko')
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

                Section::make('Setting Printer')
                    ->schema([
                        Forms\Components\ToggleButtons::make('print_via_bluetooth')
                            ->required()
                            ->label('Tipe Print')
                            ->options([
                                0 => 'Lokal (USB/Kabel/Network)',
                                1 => 'Bluetooth (Belum Paired)',
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
}
