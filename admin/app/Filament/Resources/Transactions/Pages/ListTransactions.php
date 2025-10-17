<?php

namespace App\Filament\Resources\Transactions\Pages;

use App\Filament\Resources\Transactions\TransactionResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Actions;
use App\Models\ReceiptTemplate;

class ListTransactions extends ListRecords
{
    protected static string $resource = TransactionResource::class;

    public function getMaxContentWidth(): ?string
    {
        if (filament()->getCurrentPanel()->getId() === 'pos') {
            return '7xl';
        }

        return parent::getMaxContentWidth();
    }


    public function getBreadcrumbs(): array
    {
        if (filament()->getCurrentPanel()->getId() === 'pos') {
            return [];
        }

        return parent::getBreadcrumbs();
    }

    public function getHeading(): string
    {
        if (filament()->getCurrentPanel()->getId() === 'pos') {
            return 'Daftar Transaksi';
        }

        return parent::getHeading();
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }

    public function printStruk($order, $items)
    {
        $template = ReceiptTemplate::where('is_default', true)->first() 
                    ?? ReceiptTemplate::where('is_active', true)->first();
                    
        if (!$template) {
            \Filament\Notifications\Notification::make()
                ->title('Template struk belum dikonfigurasi')
                ->warning()
                ->send();
            return;
        }
        
        $this->dispatch(
            'doPrintReceipt',
            template: $template,
            order: $order,
            items: $items,
            date: $order->created_at->format('d-m-Y H:i:s')
        );
    }
}
