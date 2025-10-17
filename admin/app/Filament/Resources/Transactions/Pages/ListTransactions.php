<?php

namespace App\Filament\Resources\TransactionResource\Pages;

use App\Filament\Resources\TransactionResource;
use Filament\Resources\Pages\ListRecords;
use Filament\Actions;
use App\Models\Setting;

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
        $this->dispatch(
            'doPrintReceipt',
            store: Setting::first(),
            order: $order,
            items: $items,
            date: $order->created_at->format('d-m-Y H:i:s')
        );
    }
}
