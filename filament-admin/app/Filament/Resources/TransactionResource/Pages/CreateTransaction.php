<?php

namespace App\Filament\Resources\TransactionResource\Pages;

use App\Filament\Resources\TransactionResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTransaction extends CreateRecord
{
    protected static string $resource = TransactionResource::class;
    protected static string $layout = 'filament-panels::components.layout.app';

    public function mount(): void
    {
        parent::mount();

        if (filament()->getCurrentPanel()->getId() === 'pos') {
            static::$layout = 'filament-panels::components.layout.base';
        }
    }

    public function getBreadcrumbs(): array
    {
        return filament()->getCurrentPanel()->getId() === 'pos'
            ? []
            : parent::getBreadcrumbs();
    }

    public function getHeading(): string
    {
        return filament()->getCurrentPanel()->getId() === 'pos'
            ? 'Tambah Transaksi'
            : parent::getHeading();
    }
}
