<?php

namespace App\Filament\Resources\PaymentMethods\Schemas;

use Filament\Forms;
use Filament\Schemas\Schema;

class PaymentMethodForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                Forms\Components\TextInput::make('name')
                    ->label('Metode Pembayaran')
                    ->required()
                    ->maxLength(255),

                Forms\Components\FileUpload::make('image')
                    ->label('Icon Pembayaran')
                    ->image()
                    ->required(),

                Forms\Components\Toggle::make('is_cash')
                    ->label('Metode Pembayaran Cash')
                    ->required(),
            ]);
    }
}
