<?php

namespace App\Filament\Resources\NotificationSettings\Schemas;

use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\TimePicker;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class NotificationSettingForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Penerima Notifikasi')
                    ->description('Tentukan siapa saja yang akan menerima laporan harian via WhatsApp')
                    ->icon('heroicon-o-users')
                    ->schema([
                        Textarea::make('receivers')
                            ->label('Nomor WhatsApp Penerima')
                            ->helperText('Format: 6281234567890 (tanpa tanda + atau spasi). Pisahkan dengan koma (,) untuk multiple penerima.')
                            ->placeholder('6281234567890,6289876543210,6285678901234')
                            ->autosize()
                            ->required()
                            ->rules([
                                'required',
                                function () {
                                    return function (string $attribute, $value, \Closure $fail) {
                                        if (empty($value)) {
                                            $fail('Nomor penerima harus diisi.');
                                            return;
                                        }

                                        $numbers = array_filter(array_map('trim', explode(',', $value)));

                                        if (empty($numbers)) {
                                            $fail('Nomor penerima harus diisi.');
                                            return;
                                        }

                                        foreach ($numbers as $number) {
                                            $cleanNumber = preg_replace('/[\s\-\+]/', '', $number);

                                            if (!preg_match('/^62\d{9,13}$/', $cleanNumber)) {
                                                $fail("Nomor '{$number}' tidak valid. Format yang benar: 6281234567890 (harus diawali 62, tanpa +, spasi, atau tanda hubung)");
                                                return;
                                            }
                                        }
                                    };
                                },
                            ])
                            ->dehydrateStateUsing(function ($state) {
                                if (empty($state)) {
                                    return $state;
                                }

                                $numbers = array_filter(array_map('trim', explode(',', $state)));
                                $cleanNumbers = array_map(function ($number) {
                                    return preg_replace('/[\s\-\+]/', '', $number);
                                }, $numbers);

                                return implode(',', $cleanNumbers);
                            })
                            ->columnSpanFull(),
                    ]),

                Section::make('Jadwal Pengiriman')
                    ->description('Atur waktu dan frekuensi pengiriman laporan otomatis')
                    ->icon('heroicon-o-clock')
                    ->schema([
                        Grid::make(2)
                            ->schema([
                                TimePicker::make('send_time')
                                    ->label('Waktu Kirim Otomatis')
                                    ->helperText('Laporan akan dikirim setiap hari pada waktu ini (WIB)')
                                    ->seconds(false)
                                    ->default('21:00:00')
                                    ->native(false)
                                    ->required(),

                                Toggle::make('is_active')
                                    ->label('Status Notifikasi')
                                    ->helperText('Aktifkan untuk mengirim laporan otomatis setiap hari')
                                    ->inline(false)
                                    ->default(true),
                            ]),
                    ]),

                Section::make('Konten Laporan')
                    ->description('Kustomisasi isi laporan yang akan dikirim')
                    ->icon('heroicon-o-document-chart-bar')
                    ->schema([
                        TextInput::make('top_limit')
                            ->label('Jumlah Produk Terlaris')
                            ->helperText('Berapa banyak produk terlaris yang ditampilkan di laporan (1-10 produk)')
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(10)
                            ->default(3)
                            ->suffix('produk')
                            ->required()
                            ->columnSpan(1),
                    ])
                    ->columnSpanFull()

            ]);
    }
}
