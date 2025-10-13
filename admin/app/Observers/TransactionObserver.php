<?php

namespace App\Observers;

use App\Models\CashFlow;
use App\Models\Transaction;
use App\Helpers\TransactionHelper;

class TransactionObserver
{
    public function creating(Transaction $transaction)
    {
        $transaction->transaction_number = TransactionHelper::generateUniqueTrxId();
    }

    public function created(Transaction $transaction)
    {
        // Only create cash flow for paid transactions
        // Pending transactions will create cash flow when status changes to paid
        if ($transaction->status === 'paid') {
            CashFlow::create([
                'date'   => now(),
                'type'   => 'income',
                'source' => 'sales',
                'amount' => $transaction->total,
                'notes'  => 'Pemasukan dari transaksi #' . $transaction->transaction_number,
            ]);
        }
    }

    public function updated(Transaction $transaction)
    {
        // Handle total amount changes for paid transactions
        if ($transaction->isDirty('total') && $transaction->status === 'paid') {
            CashFlow::where('notes', 'like', "%Pemasukan dari transaksi #{$transaction->transaction_number}%")
                ->where('source', 'sales')
                ->update([
                    'amount' => $transaction->total,
                ]);
        }

        // Handle status changes
        if ($transaction->isDirty('status')) {
            $oldStatus = $transaction->getOriginal('status');
            $newStatus = $transaction->status;

            // pending → paid: Create income cash flow
            if ($oldStatus === 'pending' && $newStatus === 'paid') {
                CashFlow::create([
                    'date'   => now(),
                    'type'   => 'income',
                    'source' => 'sales',
                    'amount' => $transaction->total,
                    'notes'  => 'Pembayaran bon dari transaksi #' . $transaction->transaction_number,
                ]);
            }

            // paid → refunded: Create expense cash flow (refund)
            if ($oldStatus === 'paid' && $newStatus === 'refunded') {
                CashFlow::create([
                    'date'   => now(),
                    'type'   => 'expense',
                    'source' => 'refund',
                    'amount' => $transaction->total,
                    'notes'  => 'Refund transaksi #' . $transaction->transaction_number,
                ]);
            }

            // paid/pending → cancelled: Create expense cash flow if was paid
            if (in_array($oldStatus, ['paid', 'pending']) && $newStatus === 'cancelled') {
                if ($oldStatus === 'paid') {
                    CashFlow::create([
                        'date'   => now(),
                        'type'   => 'expense',
                        'source' => 'refund',
                        'amount' => $transaction->total,
                        'notes'  => 'Pembatalan transaksi #' . $transaction->transaction_number,
                    ]);
                }
                // If pending → cancelled, no cash flow needed (money never came in)
            }
        }
    }

    public function deleted(Transaction $transaction)
    {
        // Only create refund cash flow if transaction was paid
        if ($transaction->status === 'paid') {
            CashFlow::create([
                'date'   => now(),
                'type'   => 'expense',
                'source' => 'refund',
                'amount' => $transaction->total,
                'notes'  => 'Pembatalan transaksi #' . $transaction->transaction_number,
            ]);
        }
    }

    public function restored(Transaction $transaction)
    {
        // Only restore cash flow if transaction is paid
        if ($transaction->status === 'paid') {
            CashFlow::create([
                'date'   => now(),
                'type'   => 'income',
                'source' => 'restored_sales',
                'amount' => $transaction->total,
                'notes'  => 'Restore transaksi #' . $transaction->transaction_number,
            ]);
        }
    }

    public function forceDeleted(Transaction $transaction)
    {
        CashFlow::where('notes', 'like', "%transaksi #{$transaction->transaction_number}%")->delete();
    }
}
