<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_method_id',
        'transaction_number',
        'name',
        'total',
        'status',
        'cash_received',
        'change_amount',
        'uuid',
        'is_synced',
        'synced_at',
    ];

    protected $casts = [
        'is_synced' => 'boolean',
        'synced_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($trx) {
            if (empty($trx->uuid)) {
                $trx->uuid = (string) Str::uuid();
            }
        });
    }

    public function transactionItems()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function products()
    {
        return $this->transactionItems()->with('product');
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    public function items()
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class, 'reference_uuid', 'uuid');
    }

    public function markSynced()
    {
        $this->update([
            'is_synced' => true,
            'synced_at' => now(),
        ]);
    }
}
