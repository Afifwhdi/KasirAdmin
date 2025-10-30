<?php

namespace App\Notifications;

use App\Models\Transaction;
use Filament\Notifications\Notification as FilamentNotification;
use Filament\Notifications\Actions\Action;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewTransactionNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Transaction $transaction
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return FilamentNotification::make()
            ->success()
            ->title('Transaksi Baru!')
            ->body("Transaksi **{$this->transaction->transaction_number}** sebesar Rp " . number_format($this->transaction->total, 0, ',', '.') . " berhasil dibuat.")
            ->icon('heroicon-o-shopping-bag')
            ->actions([
                Action::make('view')
                    ->label('Lihat Detail')
                    ->url(route('filament.admin.resources.transactions.view', ['record' => $this->transaction->id])),
            ])
            ->getDatabaseMessage();
    }

    public function toArray(object $notifiable): array
    {
        return [
            'transaction_id' => $this->transaction->id,
            'transaction_number' => $this->transaction->transaction_number,
            'total' => $this->transaction->total,
        ];
    }
}
