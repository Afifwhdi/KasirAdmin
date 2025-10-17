<?php

namespace App\Filament\Resources\CashFlows\Pages;

use Filament\Actions;
use Filament\Resources\Pages\ListRecords;
use App\Filament\Resources\CashFlows\CashFlowResource;
use Filament\Pages\Concerns\ExposesTableToWidgets;

class ListCashFlows extends ListRecords
{
    use ExposesTableToWidgets;
    
    protected static string $resource = CashFlowResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }

    protected function getHeaderWidgets(): array
    {
        return [
            CashFlowResource\Widgets\IncomeOverview::class,
        ];
    }
}
