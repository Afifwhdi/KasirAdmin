<?php

namespace App\Filament\Resources\TransactionResource\Pages;

use App\Filament\Resources\TransactionResource;
use Filament\Resources\Pages\ViewRecord;

class ViewTransaction extends ViewRecord
{
    protected static string $resource = TransactionResource::class;

    protected static ?string $title = null;

    public function getHeading(): string
    {
        if (filament()->getCurrentPanel()->getId() === 'pos') {
            return 'Detail Transaksi';
        }

        return parent::getHeading();
    }

    public function getBreadcrumbs(): array
    {
        if (filament()->getCurrentPanel()->getId() === 'pos') {
            return [];
        }

        return parent::getBreadcrumbs();
    }

    public function getMaxContentWidth(): ?string
    {
        if (filament()->getCurrentPanel()->getId() === 'pos') {
            return '5xl';
        }

        return parent::getMaxContentWidth();
    }

    /**
     * Pastikan relasi items.product selalu diload
     */
    protected function resolveRecord($key): \Illuminate\Database\Eloquent\Model
    {
        return parent::resolveRecord($key)->load('items.product');
    }

    public function getView(): string
    {
        if (filament()->getCurrentPanel()->getId() === 'pos') {
            return 'filament.pos.view-transaction';
        }

        return parent::getView();
    }
}
