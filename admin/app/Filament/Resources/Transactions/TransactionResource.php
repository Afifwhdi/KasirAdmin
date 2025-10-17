<?php

namespace App\Filament\Resources\Transactions;

use Filament\Support\Exceptions\Halt;
use Filament\Support\Enums\FontWeight;
use Filament\Notifications\Notification;
use Filament\Infolists\Components\TextEntry;
use Illuminate\Database\Eloquent\Builder;

use Filament\Resources\Resource;
use App\Filament\Resources\Transactions\Pages;
use App\Filament\Resources\Transactions\RelationManagers\TransactionItemsRelationManager;
use App\Models\Transaction;
use App\Models\PaymentMethod;
use App\Models\Product;
use Filament\Forms;
use Filament\Schemas\Schema;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Repeater;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;

use Filament\Tables\Actions\Action;
use Filament\Tables\Actions\ViewAction;
use Filament\Tables\Actions\DeleteAction;

use Filament\Tables\Actions\DeleteBulkAction;


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
        return $schema
            ->schema([
                Section::make('Produk dipesan')->schema([
                    self::getItemsRepeater(),
                ])->description('Pastikan cek stok produk sebelum simpan'),

                Group::make()->schema([
                    Section::make()->schema([
                        TextInput::make('total')
                            ->required()
                            ->readOnly()
                            ->numeric(),
                    ])
                ]),

                Group::make()->schema([
                    Section::make('Informasi Customer')->schema([
                        TextInput::make('name')
                            ->label('Nama Customer')
                            ->placeholder('Kosongkan untuk customer umum')
                            ->maxLength(255),
                    ])
                ]),

                Group::make()->schema([
                    Section::make('Pembayaran')->schema([
                        Select::make('payment_method_id')
                            ->relationship('paymentMethod', 'name')
                            ->required()
                            ->reactive()
                            ->afterStateUpdated(function ($state, Set $set, Get $get) {
                                $paymentMethod = PaymentMethod::find($state);
                                $set('is_cash', $paymentMethod?->is_cash ?? false);

                                if (!$paymentMethod?->is_cash) {
                                    $set('change_amount', 0);
                                    $set('cash_received', $get('total'));
                                }
                            })
                            ->afterStateHydrated(function (Set $set, Get $get, $state) {
                                $paymentMethod = PaymentMethod::find($state);

                                if (!$paymentMethod?->is_cash) {
                                    $set('cash_received', $get('total'));
                                    $set('change_amount', 0);
                                }

                                $set('is_cash', $paymentMethod?->is_cash ?? false);
                            }),
                        Hidden::make('is_cash')->dehydrated(),
                        TextInput::make('cash_received')
                            ->numeric()
                            ->reactive()
                            ->label('Nominal Bayar')
                            ->readOnly(fn(Get $get) => $get('is_cash') == false)
                            ->afterStateUpdated(fn(Set $set, Get $get, $state)
                            => self::updateExcangePaid($get, $set)),
                        TextInput::make('change_amount')
                            ->numeric()
                            ->label('Kembalian')
                            ->readOnly(),
                    ])
                ]),

                Section::make('Status Transaksi')->schema([
                    Select::make('status')
                        ->label('Status')
                        ->options([
                            'pending' => 'Pending',
                            'paid' => 'Paid',
                            'cancelled' => 'Cancelled',
                            'refunded' => 'Refunded',
                        ])
                        ->default('paid')
                        ->required()
                        ->native(false)
                        ->searchable(),
                ]),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('transaction_number')
                    ->label('#No.Transaksi')
                    ->weight('semibold')
                    ->prefix('#')
                    ->copyable()
                    ->copyMessage('#No.Transaksi copied')
                    ->copyMessageDuration(1500)
                    ->searchable(),
                TextColumn::make('name')
                    ->label('Nama Customer')
                    ->default('Umum')
                    ->searchable(),
                TextColumn::make('total')->label('Total Harga')->prefix('Rp ')->numeric()->sortable(),
                TextColumn::make('cash_received')->label('Nominal Bayar')->prefix('Rp ')->numeric()->sortable(),
                TextColumn::make('change_amount')->label('Kembalian')->prefix('Rp ')->numeric()->sortable(),
                TextColumn::make('created_at')->label('Transaksi dibuat')->dateTime('d M Y, H:i')->sortable()->toggleable(),
                BadgeColumn::make('paymentMethod.name')->label('Pembayaran'),
                BadgeColumn::make('status')
                    ->label('Status')
                    ->colors([
                        'success' => 'paid',
                        'warning' => 'pending',
                        'danger' => 'cancelled',
                        'gray' => 'refunded',
                    ]),
            ])
            ->filters([
                Filter::make('date_range')
                    ->form([
                        DatePicker::make('start_date')->label('Dari Tanggal'),
                        DatePicker::make('end_date')->label('Sampai Tanggal'),
                    ])
                    ->query(function (Builder $query, array $data) {
                        return $query
                            ->when($data['start_date'], fn($q, $date) => $q->whereDate('created_at', '>=', $date))
                            ->when($data['end_date'], fn($q, $date) => $q->whereDate('created_at', '<=', $date));
                    }),

                \Filament\Tables\Filters\SelectFilter::make('status')
                    ->label('Status Transaksi')
                    ->options([
                        'pending' => 'Pending',
                        'paid' => 'Paid',
                        'cancelled' => 'Cancelled',
                        'refunded' => 'Refunded',
                    ]),
            ], layout: Tables\Enums\FiltersLayout::Modal)
            ->actions([
                Action::make('pay')
                    ->label('Bayar')
                    ->icon('heroicon-o-banknotes')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Konfirmasi Pembayaran')
                    ->modalDescription(fn($record) => 'Konfirmasi bahwa pembayaran untuk transaksi ' . $record->transaction_number . ' sudah diterima. Status akan berubah menjadi Paid.')
                    ->visible(fn($record) => $record->status === 'pending')
                    ->action(function($record) {
                        $record->update(['status' => 'paid']);
                        Notification::make()
                            ->title('Pembayaran berhasil dicatat')
                            ->success()
                            ->send();
                    }),

                Action::make('cancel')
                    ->label('Batalkan')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn($record) => in_array($record->status, ['paid', 'pending']))
                    ->action(fn($record) => $record->update(['status' => 'cancelled'])),

                Action::make('refund')
                    ->label('Refund')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->color('gray')
                    ->requiresConfirmation()
                    ->modalHeading('Refund Transaksi')
                    ->modalDescription(fn($record) => 'Apakah Anda yakin ingin merefund transaksi ' . $record->transaction_number . '? Stock produk akan dikembalikan.')
                    ->visible(fn($record) => $record->status === 'paid')
                    ->action(function($record) {
                        // Restore stock for each transaction item
                        foreach ($record->transactionItems as $item) {
                            $product = Product::find($item->product_id);
                            if ($product) {
                                $product->adjustStock($item->quantity, 'refund', $record->uuid);
                            }
                        }
                        
                        // Update transaction status
                        $record->update(['status' => 'refunded']);
                        
                        Notification::make()
                            ->title('Transaksi berhasil direfund')
                            ->body('Stock produk telah dikembalikan.')
                            ->success()
                            ->send();
                    }),

                ViewAction::make()->color('warning')->label('Detail'),
                DeleteAction::make()->label('Hapus'),
            ])
            ->bulkActions([
                DeleteBulkAction::make()->label('Hapus')->button(),

                Tables\Actions\BulkAction::make('bulkPay')
                    ->label('Bayar Transaksi')
                    ->icon('heroicon-o-banknotes')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Konfirmasi Pembayaran')
                    ->modalDescription('Konfirmasi bahwa pembayaran untuk transaksi yang dipilih sudah diterima.')
                    ->action(function ($records) {
                        $paidCount = 0;
                        foreach ($records as $record) {
                            if ($record->status === 'pending') {
                                $record->update(['status' => 'paid']);
                                $paidCount++;
                            }
                        }
                        Notification::make()
                            ->title("$paidCount transaksi berhasil dibayar")
                            ->success()
                            ->send();
                    }),

                Tables\Actions\BulkAction::make('bulkCancel')
                    ->label('Batalkan Transaksi')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->action(function ($records) {
                        foreach ($records as $record) {
                            if (in_array($record->status, ['paid', 'pending'])) {
                                $record->update(['status' => 'cancelled']);
                            }
                        }
                        Notification::make()
                            ->title('Transaksi berhasil dibatalkan')
                            ->success()
                            ->send();
                    }),

                Tables\Actions\BulkAction::make('bulkRefund')
                    ->label('Refund Transaksi')
                    ->icon('heroicon-o-arrow-uturn-left')
                    ->color('gray')
                    ->requiresConfirmation()
                    ->modalHeading('Refund Transaksi Terpilih')
                    ->modalDescription('Apakah Anda yakin ingin merefund transaksi yang dipilih? Stock produk akan dikembalikan.')
                    ->action(function ($records) {
                        $refundedCount = 0;
                        foreach ($records as $record) {
                            if ($record->status === 'paid') {
                                // Restore stock for each transaction item
                                foreach ($record->transactionItems as $item) {
                                    $product = Product::find($item->product_id);
                                    if ($product) {
                                        $product->adjustStock($item->quantity, 'refund', $record->uuid);
                                    }
                                }
                                
                                $record->update(['status' => 'refunded']);
                                $refundedCount++;
                            }
                        }
                        Notification::make()
                            ->title("$refundedCount transaksi berhasil direfund")
                            ->body('Stock produk telah dikembalikan.')
                            ->success()
                            ->send();
                    }),
            ])
            ->emptyStateIcon('heroicon-o-receipt-percent')
            ->emptyStateHeading('Belum ada transaksi')
            ->emptyStateDescription('Semua transaksi yang kamu input akan tampil di sini.');
    }

    public static function getItemsRepeater(): Repeater
    {
        return Repeater::make('transactionItems')
            ->hiddenLabel()
            ->relationship()
            ->live()
            ->columns(['md' => 10])
            ->afterStateUpdated(fn(Get $get, Set $set)
            => self::updateTotalPrice($get, $set))
            ->schema([
                Select::make('product_id')
                    ->label('Produk')
                    ->required()
                    ->options(fn(Get $get) => Product::query()->pluck('name', 'id'))
                    ->afterStateUpdated(function ($state, Set $set, Get $get) {
                        $product = Product::find($state);
                        // $set('product_name_snapshot', $product->name ?? '');
                        $set('cost_price', $product->cost_price ?? 0);
                        $set('price', $product->price ?? 0);
                        $set('subtotal', ($product->price ?? 0) * ($get('quantity') ?? 1));
                        self::updateTotalPrice($get, $set);
                    })
                    ->disableOptionsWhenSelectedInSiblingRepeaterItems()
                    ->columnSpan(['md' => 5]),

                TextInput::make('quantity')
                    ->required()
                    ->numeric()
                    ->default(1)
                    ->minValue(1)
                    ->columnSpan(['md' => 5])
                    ->afterStateUpdated(function ($state, Set $set, Get $get) {
                        $id = $get('product_id');
                        $product = Product::find($id);
                        $quantity = (int) ($get('quantity') ?? 0);
                        $price = (int) ($product->price ?? 0);
                        $costPrice = (int) ($product->cost_price ?? 0);
                        $set('subtotal', $price * $quantity);
                        self::updateTotalPrice($get, $set);
                    }),

                TextInput::make('subtotal')
                    ->label('Subtotal')
                    ->numeric()
                    ->readOnly()
                    ->columnSpan(['md' => 3]),

                TextInput::make('cost_price')
                    ->label('Harga Modal')
                    ->numeric()
                    ->readOnly()
                    ->columnSpan(['md' => 3]),

                TextInput::make('price')
                    ->label('Harga Jual')
                    ->numeric()
                    ->readOnly()
                    ->columnSpan(['md' => 3]),

            ])
            ->mutateRelationshipDataBeforeSaveUsing(function (array $data) {
                $invalidProducts = collect($data['transactionItems'] ?? [])->filter(fn($item) => !Product::find($item['product_id']));
                if ($invalidProducts->isNotEmpty()) {
                    Notification::make()
                        ->title('Tidak dapat menyimpan')
                        ->body('Ada produk yang telah dihapus dari sistem.')
                        ->danger()
                        ->send();
                    throw new Halt('Produk tidak valid.');
                }
                return $data;
            });
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema
            ->schema([
                TextEntry::make('transaction_number')->label('No.Transaksi :')->badge()->color('primary')->weight(FontWeight::Bold),
                // TextEntry::make('paymentMethod.name')->label('Metode Pembayaran :')->badge()->color('primary')->weight(FontWeight::Bold),
                TextEntry::make('status')->label('Status :')->badge()->color('primary')->weight(FontWeight::Bold),
                TextEntry::make('created_at')->label('Tanggal Transaksi:')->badge()->color('primary')->weight(FontWeight::Bold),
            ])->columns(5);
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

    protected static function updateTotalPrice(Get $get, Set $set): void
    {
        $selectedProducts = collect($get('transactionItems'))
            ->filter(fn($item) => !empty($item['product_id']) && !empty($item['quantity']));
        $ids = $selectedProducts->pluck('product_id')->all();
        $products = Product::whereIn('id', $ids)->get();
        $prices = $products->pluck('price', 'id');
        $total = $selectedProducts->reduce(fn($total, $item) =>
        $total + (($prices[$item['product_id']] ?? 0) * $item['quantity']), 0);
        $set('total', $total);
    }

    protected static function updateExcangePaid(Get $get, Set $set): void
    {
        $paidAmount = (int) $get('cash_received') ?? 0;
        $totalPrice = (int) $get('total') ?? 0;
        $exchangePaid = $paidAmount - $totalPrice;
        $set('change_amount', $exchangePaid);
    }
}
