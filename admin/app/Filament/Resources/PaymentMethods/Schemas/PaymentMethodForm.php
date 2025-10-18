<?php

namespace App\Filament\Resources\PaymentMethods\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class PaymentMethodForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                TextInput::make('name')
                    ->label('Metode Pembayaran')
                    ->required()
                    ->maxLength(255),

                FileUpload::make('image')
                    ->label('Icon Pembayaran')
                    ->image()
                    ->required(),

                Toggle::make('is_cash')
                    ->label('Metode Pembayaran Cash')
                    ->required(),
            ]);
    }
}
