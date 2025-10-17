<?php

namespace App\Filament\Resources\ReceiptTemplates\Pages;

use App\Filament\Resources\ReceiptTemplates\ReceiptTemplateResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditReceiptTemplate extends EditRecord
{
    protected static string $resource = ReceiptTemplateResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
    
    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
