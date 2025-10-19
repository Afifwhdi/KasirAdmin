<?php

namespace App\Filament\Resources\Transactions\Schemas;

use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Schema;
use Filament\Support\Enums\FontWeight;

class TransactionInfolist
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([
                TextEntry::make('transaction_number')
                    ->label('No.Transaksi :')
                    ->badge()
                    ->color('primary')
                    ->weight(FontWeight::Bold),
                TextEntry::make('status')
                    ->label('Status :')
                    ->badge()
                    ->color('primary')
                    ->weight(FontWeight::Bold),
                TextEntry::make('created_at')
                    ->label('Tanggal Transaksi:')
                    ->badge()
                    ->color('primary')
                    ->weight(FontWeight::Bold),
            ])->columns(5);
    }
}
