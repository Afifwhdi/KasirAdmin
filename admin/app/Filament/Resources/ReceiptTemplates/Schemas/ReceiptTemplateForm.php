<?php

namespace App\Filament\Resources\ReceiptTemplates\Schemas;

use Filament\Forms;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ReceiptTemplateForm
{
    public static function schema(): array
    {
        return [
            Section::make('Informasi Template')
                ->schema([
                    Forms\Components\TextInput::make('name')
                        ->label('Nama Template')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('e.g., Template Default'),
                        
                    Forms\Components\Select::make('paper_width')
                        ->label('Lebar Kertas')
                        ->options([
                            '58' => '58mm (Thermal Mini)',
                            '80' => '80mm (Thermal Standard)',
                        ])
                        ->default('80')
                        ->required(),
                        
                    Forms\Components\Select::make('font_size')
                        ->label('Ukuran Font')
                        ->options([
                            'small' => 'Kecil',
                            'normal' => 'Normal',
                            'large' => 'Besar',
                        ])
                        ->default('normal')
                        ->required(),
                ])
                ->columns(3),
                
            Section::make('Konten Header')
                ->schema([
                    Forms\Components\FileUpload::make('logo_path')
                        ->label('Logo Toko')
                        ->image()
                        ->directory('receipt-logos')
                        ->maxSize(1024)
                        ->hint('Maks. 1MB, format: PNG/JPG'),
                        
                    Forms\Components\Textarea::make('header_text')
                        ->label('Teks Header')
                        ->rows(4)
                        ->placeholder("Nama Toko\nAlamat Lengkap\nTelp: 08xxxxxxxxx"),
                ])
                ->columns(2),
                
            Section::make('Konten Footer')
                ->schema([
                    Forms\Components\Textarea::make('footer_text')
                        ->label('Teks Footer')
                        ->rows(3)
                        ->placeholder("Terima kasih atas kunjungan Anda\nBarang yang sudah dibeli tidak dapat dikembalikan"),
                ])
                ->columns(1),
                
            Section::make('Pengaturan Tampilan')
                ->schema([
                    Forms\Components\Toggle::make('show_logo')
                        ->label('Tampilkan Logo')
                        ->default(true),
                        
                    Forms\Components\Toggle::make('show_barcode')
                        ->label('Tampilkan Barcode Transaksi')
                        ->default(true),
                        
                    Forms\Components\Toggle::make('show_tax')
                        ->label('Tampilkan Detail Pajak')
                        ->default(false),
                ])
                ->columns(3),
                
            Section::make('Status Template')
                ->schema([
                    Forms\Components\Toggle::make('is_active')
                        ->label('Template Aktif')
                        ->default(true)
                        ->helperText('Hanya template aktif yang bisa digunakan'),
                        
                    Forms\Components\Toggle::make('is_default')
                        ->label('Jadikan Default')
                        ->default(false)
                        ->helperText('Template ini akan digunakan secara default'),
                ])
                ->columns(2),
        ];
    }
}
