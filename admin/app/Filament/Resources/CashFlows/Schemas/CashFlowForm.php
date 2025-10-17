<?php

namespace App\Filament\Resources\CashFlows\Schemas;

use App\Services\CashFlowLabelService;
use Filament\Forms;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;

class CashFlowForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\ToggleButtons::make('type')
                    ->options(CashFlowLabelService::getTypes())
                    ->colors([
                        'income' => 'success',
                        'expense' => 'danger',
                    ])
                    ->default('income')
                    ->grouped()
                    ->live(),

                Forms\Components\Select::make('source')
                    ->options(fn (Forms\Get $get) => CashFlowLabelService::getSourceOptionsByType($get('type'))),

                Forms\Components\TextInput::make('amount')
                    ->prefix('Rp ')
                    ->required()
                    ->numeric(),

                Forms\Components\DatePicker::make('date')
                    ->required(),

                Forms\Components\Textarea::make('notes')
                    ->columnSpanFull(),
            ]);
    }
}
