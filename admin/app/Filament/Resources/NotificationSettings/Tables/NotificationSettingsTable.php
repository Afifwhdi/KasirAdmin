<?php

namespace App\Filament\Resources\NotificationSettings\Tables;

use App\Jobs\SendDailyReportJob;
use App\Services\FonnteService;
use Filament\Notifications\Notification;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Actions\Action;
use Filament\Actions\DeleteBulkAction;
use Filament\Forms\Components\Select;



class NotificationSettingsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('receivers')
                    ->label('Nomor Penerima')
                    ->formatStateUsing(function ($state) {
                        if (empty($state)) {
                            return '-';
                        }

                        $numbers = array_filter(array_map('trim', explode(',', $state)));
                        $count = count($numbers);

                        if ($count === 1) {
                            return $numbers[0];
                        }

                        return $numbers[0] . " (+" . ($count - 1) . " lainnya)";
                    })
                    ->description(function ($record) {
                        if (empty($record->receivers)) {
                            return null;
                        }

                        $numbers = array_filter(array_map('trim', explode(',', $record->receivers)));
                        $count = count($numbers);

                        return "Total: {$count} nomor";
                    })
                    ->searchable()
                    ->copyable()
                    ->copyMessage('Nomor berhasil dicopy'),

                TextColumn::make('send_time')
                    ->label('Waktu Kirim')
                    ->time('H:i')
                    ->sortable(),

                IconColumn::make('is_active')
                    ->label('Status')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('danger'),

                TextColumn::make('top_limit')
                    ->label('Jumlah Produk')
                    ->suffix(' produk')
                    ->sortable(),

                TextColumn::make('created_at')
                    ->label('Dibuat')
                    ->dateTime('d M Y, H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->label('Diupdate')
                    ->dateTime('d M Y, H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])

            ->recordActions([
                Action::make('send_now')
                    ->label('Kirim Semua')
                    ->icon('heroicon-o-paper-airplane')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Kirim Laporan Sekarang?')
                    ->modalDescription('Laporan harian akan segera dikirim ke semua nomor penerima.')
                    ->modalSubmitActionLabel('Ya, Kirim Sekarang')
                    ->action(function () {
                        try {
                            SendDailyReportJob::dispatch();
                            Notification::make()
                                ->title('Laporan Dikirim')
                                ->body('Laporan harian sedang diproses dan akan dikirim segera.')
                                ->success()
                                ->send();
                        } catch (\Exception $e) {
                            Notification::make()
                                ->title('Gagal Mengirim')
                                ->body('Terjadi kesalahan: ' . $e->getMessage())
                                ->danger()
                                ->send();
                        }
                    }),
                EditAction::make(),
            ])
            ->toolbarActions([
                DeleteBulkAction::make(),
            ]);
    }
}
