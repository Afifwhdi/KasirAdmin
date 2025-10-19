<?php

namespace App\Filament\Resources\Transactions\Tables;

use App\Models\Product;
use Filament\Forms\Components\DatePicker;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Enums\FiltersLayout;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Filament\Actions\Action;
use Filament\Actions\BulkAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\ViewAction;
use Filament\Actions\DeleteAction;

class TransactionsTable
{
    public static function configure(Table $table): Table
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
                TextColumn::make('total')
                    ->label('Total Harga')
                    ->prefix('Rp ')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('cash_received')
                    ->label('Nominal Bayar')
                    ->prefix('Rp ')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('change_amount')
                    ->label('Kembalian')
                    ->prefix('Rp ')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Transaksi dibuat')
                    ->dateTime('d M Y, H:i')
                    ->sortable()
                    ->toggleable(),
                BadgeColumn::make('paymentMethod.name')
                    ->label('Pembayaran'),
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

                SelectFilter::make('status')
                    ->label('Status Transaksi')
                    ->options([
                        'pending' => 'Pending',
                        'paid' => 'Paid',
                        'cancelled' => 'Cancelled',
                        'refunded' => 'Refunded',
                    ]),
            ], layout: FiltersLayout::Modal)
            ->actions([
                Action::make('pay')
                    ->label('Bayar')
                    ->icon('heroicon-o-banknotes')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Konfirmasi Pembayaran')
                    ->modalDescription(fn($record) => 'Konfirmasi bahwa pembayaran untuk transaksi ' . $record->transaction_number . ' sudah diterima. Status akan berubah menjadi Paid.')
                    ->visible(fn($record) => $record->status === 'pending')
                    ->action(function ($record) {
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
                    ->action(function ($record) {
                        foreach ($record->transactionItems as $item) {
                            $product = Product::find($item->product_id);
                            if ($product) {
                                $product->adjustStock($item->quantity, 'refund', $record->uuid);
                            }
                        }

                        $record->update(['status' => 'refunded']);

                        Notification::make()
                            ->title('Transaksi berhasil direfund')
                            ->body('Stock produk telah dikembalikan.')
                            ->success()
                            ->send();
                    }),

                ViewAction::make()
                    ->color('warning')
                    ->label('Detail'),
                DeleteAction::make()
                    ->label('Hapus'),
            ])
            ->bulkActions([
                DeleteBulkAction::make()
                    ->label('Hapus')
                    ->button(),

                BulkAction::make('bulkPay')
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

                BulkAction::make('bulkCancel')
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

                BulkAction::make('bulkRefund')
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
}
