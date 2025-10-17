<?php

namespace App\Filament\Resources\Transactions\Pages;

use App\Filament\Resources\Transactions\TransactionResource;
use Filament\Resources\Pages\EditRecord;
use Filament\Actions;

class EditTransaction extends EditRecord
{
    protected static string $resource = TransactionResource::class;
    protected static string $layout = 'filament-panels::components.layout.app';

    public function mount($record): void
    {
        parent::mount($record);

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
            ? 'Edit Transaksi'
            : parent::getHeading();
    }

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
