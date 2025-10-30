<?php

namespace App\Notifications;

use App\Models\Product;
use Filament\Notifications\Notification as FilamentNotification;
use Filament\Notifications\Actions\Action;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class LowStockNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Product $product
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return FilamentNotification::make()
            ->warning()
            ->title('Stok Produk Menipis!')
            ->body("Produk **{$this->product->name}** tersisa {$this->product->stock} unit. Segera lakukan restock!")
            ->icon('heroicon-o-exclamation-triangle')
            ->actions([
                Action::make('view')
                    ->label('Lihat Produk')
                    ->url(route('filament.admin.resources.products.edit', ['record' => $this->product->id])),
            ])
            ->getDatabaseMessage();
    }

    public function toArray(object $notifiable): array
    {
        return [
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'stock' => $this->product->stock,
        ];
    }
}
