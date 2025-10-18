<?php

namespace App\Filament\Resources\ReceiptTemplates\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ReceiptTemplateForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Section::make('Informasi Template')
                    ->description('Setup dasar template struk untuk printer thermal')
                    ->schema([
                        TextInput::make('name')
                            ->label('Nama Template')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Misal: Template Toko Utama')
                            ->helperText('Nama untuk identifikasi template'),

                        Select::make('paper_width')
                            ->label('Lebar Kertas')
                            ->options([
                                '58' => '58mm (Thermal Mini)',
                                '80' => '80mm (Thermal Standard)',
                            ])
                            ->default('80')
                            ->required()
                            ->helperText('Sesuaikan dengan lebar kertas printer thermal Anda'),

                        Select::make('font_size')
                            ->label('Ukuran Font')
                            ->options([
                                'small' => 'Kecil',
                                'normal' => 'Normal',
                                'large' => 'Besar',
                            ])
                            ->default('normal')
                            ->required()
                            ->helperText('Ukuran teks pada struk'),
                    ])
                    ->columns(3)
                    ->collapsible(),
                
                Section::make('Konten Header')
                    ->description('Informasi yang muncul di bagian atas struk')
                    ->schema([
                        FileUpload::make('logo_path')
                            ->label('Logo Toko (Opsional)')
                            ->image()
                            ->directory('receipt-logos')
                            ->maxSize(1024)
                            ->imageEditor()
                            ->imageEditorAspectRatios([
                                '1:1',
                                '16:9',
                            ])
                            ->hint('Maks. 1MB, format: PNG/JPG')
                            ->helperText('Upload logo toko Anda untuk ditampilkan di struk')
                            ->columnSpanFull(),

                        Textarea::make('header_text')
                            ->label('Teks Header')
                            ->rows(5)
                            ->required()
                            ->placeholder("TOKO SAYA\nJl. Contoh No. 123, Jakarta\nTelp: 081234567890\nEmail: toko@example.com")
                            ->helperText('Nama toko, alamat, kontak. Tekan Enter untuk baris baru.')
                            ->columnSpanFull(),
                    ])
                    ->columns(1)
                    ->collapsible(),
                
                Section::make('Konten Footer')
                    ->description('Pesan atau informasi tambahan di bagian bawah struk')
                    ->schema([
                        Textarea::make('footer_text')
                            ->label('Teks Footer')
                            ->rows(4)
                            ->placeholder("Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat dikembalikan\n\nFollow IG: @tokosaya")
                            ->helperText('Ucapan terima kasih, kebijakan return, atau info promo'),
                    ])
                    ->columns(1)
                    ->collapsible(),
                
                Section::make('Pengaturan Tampilan')
                    ->description('Atur elemen yang ditampilkan pada struk')
                    ->schema([
                        Toggle::make('show_logo')
                            ->label('Tampilkan Logo')
                            ->default(true)
                            ->inline(false)
                            ->helperText('Tampilkan logo toko di struk (jika sudah diupload)'),

                        Toggle::make('show_barcode')
                            ->label('Tampilkan Barcode Transaksi')
                            ->default(true)
                            ->inline(false)
                            ->helperText('Barcode untuk tracking transaksi'),

                        Toggle::make('show_tax')
                            ->label('Tampilkan Detail Pajak')
                            ->default(false)
                            ->inline(false)
                            ->helperText('Tampilkan breakdown pajak jika ada'),
                    ])
                    ->columns(3)
                    ->collapsible(),
                
                Section::make('Status Template')
                    ->description('Atur status dan penggunaan template')
                    ->schema([
                        Toggle::make('is_active')
                            ->label('Aktifkan Template')
                            ->default(true)
                            ->inline(false)
                            ->helperText('Template aktif dapat digunakan untuk print struk'),

                        Toggle::make('is_default')
                            ->label('Jadikan Template Default')
                            ->default(false)
                            ->inline(false)
                            ->helperText('Template default akan otomatis digunakan saat print struk')
                            ->reactive()
                            ->afterStateUpdated(function ($state) {
                                if ($state) {
                                    Notification::make()
                                        ->title('Template Default')
                                        ->body('Template lain akan otomatis di-nonaktifkan sebagai default')
                                        ->info()
                                        ->send();
                                }
                            }),
                    ])
                    ->columns(2)
                    ->collapsible(),
            ]);
    }
}
