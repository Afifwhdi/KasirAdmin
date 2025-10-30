<?php

namespace App\Filament\Resources\Transactions\Schemas;

use App\Models\PaymentMethod;
use App\Models\Product;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Schemas\Components\Group;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
use Filament\Schemas\Schema;
use Filament\Support\Exceptions\Halt;

class TransactionForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->schema([

                Section::make('Produk dipesan')
                    ->schema([
                        self::getItemsRepeater(),
                        TextInput::make('total')
                            ->required()
                            ->readOnly()
                            ->numeric(),
                    ])
                    ->description('Pastikan cek stok produk sebelum simpan')
                    ->columnSpanFull(),

                    Section::make('Informasi Pembayaran')->schema([

                    TextInput::make('name')
                        ->label('Nama Customer')
                        ->placeholder('Kosongkan untuk customer umum')
                        ->maxLength(255),

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
                        => self::updateExchangePaid($get, $set)),
                    TextInput::make('change_amount')
                        ->numeric()
                        ->label('Kembalian')
                        ->readOnly(),

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
                ])
                    ->description('Pastikan nama dan informasi harga jangan sampai salah')
                    ->columnSpanFull(),
            ]);
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

    protected static function updateExchangePaid(Get $get, Set $set): void
    {
        $paidAmount = (int) $get('cash_received') ?? 0;
        $totalPrice = (int) $get('total') ?? 0;
        $exchangePaid = $paidAmount - $totalPrice;
        $set('change_amount', $exchangePaid);
    }
}
