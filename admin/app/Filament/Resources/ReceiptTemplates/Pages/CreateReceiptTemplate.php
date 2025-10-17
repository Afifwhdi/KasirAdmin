<?php

namespace App\Filament\Resources\ReceiptTemplates\Pages;

use App\Filament\Resources\ReceiptTemplates\ReceiptTemplateResource;
use Filament\Resources\Pages\CreateRecord;

class CreateReceiptTemplate extends CreateRecord
{
    protected static string $resource = ReceiptTemplateResource::class;
    
    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
