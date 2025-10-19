<?php

namespace App\Filament\Resources\Transactions;

use App\Filament\Resources\Transactions\Pages;
use App\Filament\Resources\Transactions\RelationManagers\TransactionItemsRelationManager;
use App\Filament\Resources\Transactions\Schemas\TransactionForm;
use App\Filament\Resources\Transactions\Schemas\TransactionInfolist;
use App\Filament\Resources\Transactions\Tables\TransactionsTable;
use App\Models\Transaction;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class TransactionResource extends Resource
{
    protected static ?string $model = Transaction::class;
    protected static string | \BackedEnum | null $navigationIcon = 'heroicon-o-shopping-bag';
    protected static ?string $navigationLabel = 'Transaksi';
    protected static ?string $pluralLabel = 'Transaksi';
    protected static string | \UnitEnum | null $navigationGroup = 'Menejemen keuangan';
    protected static ?int $navigationSort = 3;

    public static function getNavigationBadge(): ?string
    {
        return static::getModel()::count();
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->orderBy('created_at', 'desc');
    }

    public static function form(Schema $schema): Schema
    {
        return TransactionForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TransactionsTable::configure($table);
    }

    public static function infolist(Schema $schema): Schema
    {
        return TransactionInfolist::configure($schema);
    }

    public static function getRelations(): array
    {
        return [TransactionItemsRelationManager::class];
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListTransactions::route('/'),
            'view' => Pages\ViewTransaction::route('/{record}'),
        ];
    }
}
