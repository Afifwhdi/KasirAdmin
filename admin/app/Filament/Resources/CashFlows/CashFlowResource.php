<?php

namespace App\Filament\Resources\CashFlows;

use App\Filament\Resources\CashFlows\Pages;
use App\Filament\Resources\CashFlows\Schemas\CashFlowForm;
use App\Filament\Resources\CashFlows\Tables\CashFlowsTable;
use App\Filament\Resources\CashFlows\Widgets;
use App\Models\CashFlow;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;

class CashFlowResource extends Resource
{
    protected static ?string $model = CashFlow::class;

    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-chart-bar';

    protected static ?int $navigationSort = 5;

    protected static ?string $navigationLabel = 'Alur Kas';

    protected static string | \UnitEnum | null $navigationGroup = 'Menejemen keuangan';

    public static function getNavigationBadge(): ?string
    {
        return (string) CashFlow::count();
    }

    public static function form(Schema $schema): Schema
    {
        return CashFlowForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CashFlowsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCashFlows::route('/'),
        ];
    }

    public static function getWidgets(): array
    {
        return [
            Widgets\IncomeOverview::class,
        ];
    }
}
