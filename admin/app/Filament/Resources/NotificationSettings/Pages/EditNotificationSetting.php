<?php

namespace App\Filament\Resources\NotificationSettings\Pages;

use App\Filament\Resources\NotificationSettings\NotificationSettingResource;
use App\Jobs\SendDailyReportJob;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

class EditNotificationSetting extends EditRecord
{
    protected static string $resource = NotificationSettingResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('send_now')
                ->label('Kirim Sekarang')
                ->icon('heroicon-o-paper-airplane')
                ->color('success')
                ->requiresConfirmation()
                ->modalHeading('Kirim Laporan Sekarang')
                ->modalDescription('Apakah Anda yakin ingin mengirim laporan harian sekarang ke semua penerima?')
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
            DeleteAction::make(),
        ];
    }
}
