<?php

namespace App\Observers;

use App\Models\Transaction;
use App\Helpers\TransactionHelper;

class TransactionObserver
{
    public function creating(Transaction $transaction)
    {
        $transaction->transaction_number = TransactionHelper::generateUniqueTrxId();
    }
}
