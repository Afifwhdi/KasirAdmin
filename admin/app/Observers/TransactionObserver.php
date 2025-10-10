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
        CashFlow::create([
            'date'   => now(),
            'type'   => 'income',
            'source' => 'sales',
            'amount' => $transaction->total,
            'notes'  => 'Pemasukan dari transaksi #' . $transaction->transaction_number,
        ]);
    }

    public function updated(Transaction $transaction)
    {
        if ($transaction->isDirty('total')) {
            CashFlow::where('notes', 'like', "%Pemasukan dari transaksi #{$transaction->transaction_number}%")
                ->update([
                    'amount' => $transaction->total,
                ]);
        }
    }

    public function deleted(Transaction $transaction)
    {
        CashFlow::create([
            'date'   => now(),
            'type'   => 'expense',
            'source' => 'refund',
            'amount' => $transaction->total,
            'notes'  => 'Pembatalan transaksi #' . $transaction->transaction_number,
        ]);
    }

    public function restored(Transaction $transaction)
    {
        CashFlow::create([
            'date'   => now(),
            'type'   => 'income',
            'source' => 'restored_sales',
            'amount' => $transaction->total,
            'notes'  => 'Restore transaksi #' . $transaction->transaction_number,
        ]);
    }

    public function forceDeleted(Transaction $transaction)
    {
        CashFlow::where('notes', 'like', "%transaksi #{$transaction->transaction_number}%")->delete();
    }
}
